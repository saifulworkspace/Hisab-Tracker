import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getDashboardSummary,
  getAllReceivables,
  getAllPayables,
  getAllPropertiesWithPayments,
  getMoneyTransactions,
  recordMoneyTransaction,
  addOrUpdatePerson,
  seedInitialData
} from "./db";
import { getDb } from "./db";
import { receivables, payables, properties, propertyPayments, persons, sheetSyncConfig } from "../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
import { getOptionalSheetConfig, syncSheetsIfConfigured } from "./sheetsSync";
import { z } from "zod";

const financeProcedure = protectedProcedure;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  finance: router({
    // Initialize seed data on demand if empty
    seed: financeProcedure.mutation(async ({ ctx }) => {
      await seedInitialData(ctx.user.id);
      return { success: true };
    }),

    // Get complete dashboard summary
    dashboard: financeProcedure.query(async ({ ctx }) => {
      await seedInitialData(ctx.user.id);
      return await getDashboardSummary(ctx.user.id);
    }),

    listReceivables: financeProcedure.query(async ({ ctx }) => {
      await seedInitialData(ctx.user.id);
      return await getAllReceivables(ctx.user.id);
    }),

    listPayables: financeProcedure.query(async ({ ctx }) => {
      await seedInitialData(ctx.user.id);
      return await getAllPayables(ctx.user.id);
    }),

    propertyDetails: financeProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        await seedInitialData(ctx.user.id);
        const properties = await getAllPropertiesWithPayments(ctx.user.id);
        return properties.find((property) => property.id === input.id) ?? null;
      }),

    transactionHistory: financeProcedure.query(async ({ ctx }) => {
      await seedInitialData(ctx.user.id);
      return await getMoneyTransactions(ctx.user.id);
    }),

    // Add / Edit Receivable
    upsertReceivable: financeProcedure
      .input(
        z.object({
          id: z.number().optional(),
          personName: z.string().min(1),
          amount: z.string().min(1),
          currency: z.enum(["BDT", "SR"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        const personId = await addOrUpdatePerson(ctx.user.id, input.personName, "receivable");

        if (input.id) {
          await db
            .update(receivables)
            .set({
              userId: ctx.user.id,
              personId,
              personName: input.personName,
              amount: input.amount,
              currency: input.currency,
              notes: input.notes || null,
            })
            .where(and(eq(receivables.id, input.id), eq(receivables.userId, ctx.user.id)));
        } else {
          await db.insert(receivables).values({
            userId: ctx.user.id,
            personId,
            personName: input.personName,
            amount: input.amount,
            currency: input.currency,
            notes: input.notes || null,
          });
        }
        const sync = await syncSheetsIfConfigured(ctx.user.id);
        return { success: true, sync };
      }),

    recordReceivablePayment: financeProcedure
      .input(z.object({
        personName: z.string().min(1),
        amount: z.string().min(1),
        currency: z.enum(["BDT", "SR"]),
        transactionDate: z.string().min(1),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await recordMoneyTransaction(ctx.user.id, { ...input, kind: "receivable_received" });
        const sync = await syncSheetsIfConfigured(ctx.user.id);
        return { success: true, sync };
      }),

    deleteReceivable: financeProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.delete(receivables).where(and(eq(receivables.id, input.id), eq(receivables.userId, ctx.user.id)));
        const sync = await syncSheetsIfConfigured(ctx.user.id);
        return { success: true, sync };
      }),

    // Add / Edit Payable
    upsertPayable: financeProcedure
      .input(
        z.object({
          id: z.number().optional(),
          personName: z.string().min(1),
          amount: z.string().min(1),
          currency: z.enum(["BDT", "SR"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        const personId = await addOrUpdatePerson(ctx.user.id, input.personName, "payable");

        if (input.id) {
          await db
            .update(payables)
            .set({
              userId: ctx.user.id,
              personId,
              personName: input.personName,
              amount: input.amount,
              currency: input.currency,
              notes: input.notes || null,
            })
            .where(and(eq(payables.id, input.id), eq(payables.userId, ctx.user.id)));
        } else {
          await db.insert(payables).values({
            userId: ctx.user.id,
            personId,
            personName: input.personName,
            amount: input.amount,
            currency: input.currency,
            notes: input.notes || null,
          });
        }
        const sync = await syncSheetsIfConfigured(ctx.user.id);
        return { success: true, sync };
      }),

    recordPayablePayment: financeProcedure
      .input(z.object({
        personName: z.string().min(1),
        amount: z.string().min(1),
        currency: z.enum(["BDT", "SR"]),
        transactionDate: z.string().min(1),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await recordMoneyTransaction(ctx.user.id, { ...input, kind: "payable_paid" });
        const sync = await syncSheetsIfConfigured(ctx.user.id);
        return { success: true, sync };
      }),

    deletePayable: financeProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.delete(payables).where(and(eq(payables.id, input.id), eq(payables.userId, ctx.user.id)));
        const sync = await syncSheetsIfConfigured(ctx.user.id);
        return { success: true, sync };
      }),

    // Add Property
    upsertProperty: financeProcedure
      .input(
        z.object({
          id: z.number().optional(),
          name: z.string().min(1),
          budget: z.string().min(1),
          currency: z.enum(["BDT", "SR"]).default("BDT"),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        if (input.id) {
          await db
            .update(properties)
            .set({
              name: input.name,
              budget: input.budget,
              currency: input.currency,
              notes: input.notes || null,
            })
            .where(and(eq(properties.id, input.id), eq(properties.userId, ctx.user.id)));
        } else {
          await db.insert(properties).values({
            userId: ctx.user.id,
            name: input.name,
            budget: input.budget,
            currency: input.currency,
            notes: input.notes || null,
          });
        }
        const sync = await syncSheetsIfConfigured(ctx.user.id);
        return { success: true, sync };
      }),

    // Add Property Payment (itemized transaction)
    addPropertyPayment: financeProcedure
      .input(
        z.object({
          propertyId: z.number(),
          amount: z.string().min(1),
          paymentDate: z.string().min(1), // e.g. "13 Aug" or "2026-08-13"
          currency: z.enum(["BDT", "SR"]).default("BDT"),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        const [prop] = await db.select().from(properties).where(and(eq(properties.id, input.propertyId), eq(properties.userId, ctx.user.id))).limit(1);
        if (!prop) throw new Error("Property not found");

        await db.insert(propertyPayments).values({
          userId: ctx.user.id,
          propertyId: input.propertyId,
          propertyName: prop.name,
          amount: input.amount,
          paymentDate: input.paymentDate,
          currency: input.currency,
          notes: input.notes || null,
        });

        const sync = await syncSheetsIfConfigured(ctx.user.id);
        return { success: true, sync };
      }),

    deletePropertyPayment: financeProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.delete(propertyPayments).where(and(eq(propertyPayments.id, input.id), eq(propertyPayments.userId, ctx.user.id)));
        const sync = await syncSheetsIfConfigured(ctx.user.id);
        return { success: true, sync };
      }),

    // Google Sheets Config (Optional Sync status)
    getSheetConfig: financeProcedure.query(async ({ ctx }) => {
      const config = await getOptionalSheetConfig(ctx.user.id);
      return config || { apiKey: "", spreadsheetId: "", webhookUrl: "", syncStatus: "idle", lastSyncedAt: null, lastError: null };
    }),

    saveSheetConfig: financeProcedure
      .input(
        z.object({
          apiKey: z.string().optional(),
          spreadsheetId: z.string().optional(),
          webhookUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        const [existing] = await db.select().from(sheetSyncConfig).where(eq(sheetSyncConfig.userId, ctx.user.id)).limit(1);
        if (existing) {
          await db
            .update(sheetSyncConfig)
            .set({
              apiKey: input.apiKey ?? existing.apiKey,
              spreadsheetId: input.spreadsheetId ?? existing.spreadsheetId,
              webhookUrl: input.webhookUrl ?? existing.webhookUrl,
              syncStatus: "connected",
              lastSyncedAt: new Date(),
            })
            .where(and(eq(sheetSyncConfig.id, existing.id), eq(sheetSyncConfig.userId, ctx.user.id)));
        } else {
          await db.insert(sheetSyncConfig).values({
            userId: ctx.user.id,
            apiKey: input.apiKey || null,
            spreadsheetId: input.spreadsheetId || "",
            webhookUrl: input.webhookUrl || "",
            syncStatus: "connected",
            lastSyncedAt: new Date(),
          });
        }
        const sync = await syncSheetsIfConfigured(ctx.user.id);
        return { success: true, sync };
      }),
  }),
});

export type AppRouter = typeof appRouter;
