import { and, eq } from "drizzle-orm";
import { getDb, getDashboardSummary } from "./db";
import { sheetSyncConfig } from "../drizzle/schema";

export const SHEET_TAB_NAMES = ["Receivables", "Payables", "Properties"] as const;

export type SheetSyncResult = {
  status: "synced" | "local-only" | "error";
  message: string;
};

function buildSheetPayload(snapshot: Awaited<ReturnType<typeof getDashboardSummary>>, spreadsheetId: string) {
  return {
    spreadsheetId,
    tabs: {
      Receivables: snapshot.receivables.map((entry) => ({
        Name: entry.personName,
        Amount: Number(entry.amount),
        Currency: entry.currency,
        Notes: entry.notes ?? "",
      })),
      Payables: snapshot.payables.map((entry) => ({
        Name: entry.personName,
        Amount: Number(entry.amount),
        Currency: entry.currency,
        Notes: entry.notes ?? "",
      })),
      Properties: snapshot.properties.flatMap((property) =>
        property.payments.length
          ? property.payments.map((payment) => ({
              Property: property.name,
              Budget: Number(property.budget),
              Currency: property.currency,
              PaymentDate: payment.paymentDate,
              Payment: Number(payment.amount),
              TotalPaid: property.totalPaid,
              DueAmount: property.dueAmount,
            }))
          : [{
              Property: property.name,
              Budget: Number(property.budget),
              Currency: property.currency,
              PaymentDate: "",
              Payment: 0,
              TotalPaid: 0,
              DueAmount: Number(property.budget),
            }],
      ),
    },
    tabNames: [...SHEET_TAB_NAMES],
    syncedAt: new Date().toISOString(),
  };
}

export async function getOptionalSheetConfig(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [config] = await db.select().from(sheetSyncConfig).where(eq(sheetSyncConfig.userId, userId)).limit(1);
  return config ?? null;
}

export async function syncSheetsIfConfigured(userId: number): Promise<SheetSyncResult> {
  const db = await getDb();
  if (!db) return { status: "local-only", message: "Local database is unavailable." };

  const [config] = await db.select().from(sheetSyncConfig).where(eq(sheetSyncConfig.userId, userId)).limit(1);
  if (!config?.spreadsheetId || !config.webhookUrl) {
    return { status: "local-only", message: "Google Sheets is optional and not configured." };
  }

  try {
    const snapshot = await getDashboardSummary(userId);
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildSheetPayload(snapshot, config.spreadsheetId)),
    });
    if (!response.ok) {
      throw new Error(`Sync endpoint returned ${response.status}`);
    }

    await db.update(sheetSyncConfig).set({
      syncStatus: "synced",
      lastSyncedAt: new Date(),
      lastError: null,
    }).where(and(eq(sheetSyncConfig.id, config.id), eq(sheetSyncConfig.userId, userId)));
    return { status: "synced", message: "Google Sheets updated." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Sheets sync failed.";
    await db.update(sheetSyncConfig).set({
      syncStatus: "error",
      lastError: message,
    }).where(and(eq(sheetSyncConfig.id, config.id), eq(sheetSyncConfig.userId, userId)));
    // Local writes remain successful even if the optional remote sync is unavailable.
    return { status: "error", message };
  }
}
