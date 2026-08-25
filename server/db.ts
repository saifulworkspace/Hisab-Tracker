import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  persons,
  receivables,
  payables,
  properties,
  propertyPayments,
  moneyTransactions,
  Receivable,
  Payable,
  Property,
  PropertyPayment,
  Person,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result;
}

export async function seedInitialData(userId: number) {
  const db = await getDb();
  if (!db) return;
  const existingPersons = await db.select().from(persons).where(eq(persons.userId, userId)).limit(1);
  if (existingPersons.length > 0) return;

  const recsToSeed = [
    { name: "Ibrahim", amount: "150000.00", currency: "BDT" as const },
    { name: "Ismail", amount: "1579.00", currency: "SR" as const },
    { name: "Shorif", amount: "3910.00", currency: "SR" as const },
    { name: "Emon", amount: "2665.00", currency: "SR" as const },
  ];
  for (const item of recsToSeed) {
    const personId = await addOrUpdatePerson(userId, item.name, "receivable");
    await db.insert(receivables).values({ userId, personId, personName: item.name, amount: item.amount, currency: item.currency, notes: "Initial seeded receivable" });
  }

  const personId = await addOrUpdatePerson(userId, "Ariful Islam", "payable");
  await db.insert(payables).values({ userId, personId, personName: "Ariful Islam", amount: "3000.00", currency: "SR", notes: "Initial seeded payable" });

  const prop1Res = await db.insert(properties).values({ userId, name: "Istanbul Hotel & Resort", budget: "400000.00", currency: "BDT", notes: "Hotel & Resort development project" });
  const prop1Id = Number(prop1Res[0].insertId);
  for (const payment of [
    ["13 Apr", "25000.00"], ["12 May", "25000.00"], ["1 Jun", "10000.00"], ["25 July", "10000.00"], ["13 Aug", "10000.00"],
  ]) {
    await db.insert(propertyPayments).values({ userId, propertyId: prop1Id, propertyName: "Istanbul Hotel & Resort", amount: payment[1], paymentDate: payment[0], currency: "BDT", notes: "Scheduled property payment" });
  }

  const prop2Res = await db.insert(properties).values({ userId, name: "Three Thirteen Uddyog Bangladesh", budget: "166000.00", currency: "BDT", notes: "Uddyog Bangladesh investment" });
  await db.insert(propertyPayments).values({ userId, propertyId: Number(prop2Res[0].insertId), propertyName: "Three Thirteen Uddyog Bangladesh", amount: "4400.00", paymentDate: "Initial", currency: "BDT", notes: "Initial installment" });
}

export function calculateCurrencyTotals(rows: Array<{ amount: string | number; currency: string }>) {
  const totals: Record<string, number> = { BDT: 0, SR: 0 };
  rows.forEach((row) => { totals[row.currency] = (totals[row.currency] || 0) + Number(row.amount); });
  return totals;
}

export function calculatePropertyMetrics(budget: string | number, payments: Array<{ amount: string | number }>) {
  const budgetNum = Number(budget);
  const totalPaid = payments.reduce((acc, payment) => acc + Number(payment.amount), 0);
  const dueAmount = Math.max(0, budgetNum - totalPaid);
  const progressPercent = budgetNum > 0 ? Math.min(100, Math.round((totalPaid / budgetNum) * 100)) : 0;
  return { totalPaid, dueAmount, progressPercent };
}

export async function getAllReceivables(userId: number) {
  const db = await getDb();
  return db ? db.select().from(receivables).where(eq(receivables.userId, userId)) : [];
}

export async function getAllPayables(userId: number) {
  const db = await getDb();
  return db ? db.select().from(payables).where(eq(payables.userId, userId)) : [];
}

export async function getAllPropertiesWithPayments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const props = await db.select().from(properties).where(eq(properties.userId, userId));
  const payments = await db.select().from(propertyPayments).where(eq(propertyPayments.userId, userId));
  return props.map((prop) => {
    const propPayments = payments.filter((payment) => payment.propertyId === prop.id);
    return { ...prop, payments: propPayments, ...calculatePropertyMetrics(prop.budget, propPayments) };
  });
}

export async function getDashboardSummary(userId: number) {
  const recs = await getAllReceivables(userId);
  const pays = await getAllPayables(userId);
  const propsWithPayments = await getAllPropertiesWithPayments(userId);
  const receivablesByCurrency = calculateCurrencyTotals(recs);
  const payablesByCurrency = calculateCurrencyTotals(pays);
  let totalPropertyBudget = 0;
  let totalPropertyPaid = 0;
  let totalPropertyDue = 0;
  propsWithPayments.forEach((property) => {
    if (property.currency === "BDT") {
      totalPropertyBudget += Number(property.budget);
      totalPropertyPaid += property.totalPaid;
      totalPropertyDue += property.dueAmount;
    }
  });
  return {
    receivables: recs,
    payables: pays,
    properties: propsWithPayments,
    summary: { receivablesByCurrency, payablesByCurrency, propertyStatus: { currency: "BDT", totalBudget: totalPropertyBudget, totalPaid: totalPropertyPaid, totalDue: totalPropertyDue } },
  };
}

export async function recordMoneyTransaction(userId: number, input: { personName: string; kind: "receivable_received" | "payable_paid"; amount: string; currency: "BDT" | "SR"; transactionDate: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const ledgerTable = input.kind === "receivable_received" ? receivables : payables;
  const personType = input.kind === "receivable_received" ? "receivable" as const : "payable" as const;
  const personId = await addOrUpdatePerson(userId, input.personName, personType);
  const [ledgerRow] = await db.select().from(ledgerTable).where(and(eq(ledgerTable.userId, userId), eq(ledgerTable.personId, personId))).limit(1);
  if (!ledgerRow) throw new Error("No outstanding account exists for this person");
  const currentAmount = Number(ledgerRow.amount);
  const transactionAmount = Number(input.amount);
  if (transactionAmount <= 0) throw new Error("Transaction amount must be greater than zero");
  if (transactionAmount > currentAmount) throw new Error("Transaction cannot exceed the outstanding balance");
  await db.update(ledgerTable).set({ amount: (currentAmount - transactionAmount).toFixed(2) }).where(and(eq(ledgerTable.userId, userId), eq(ledgerTable.id, ledgerRow.id)));
  await db.insert(moneyTransactions).values({ userId, personId, personName: input.personName, kind: input.kind, amount: input.amount, currency: input.currency, transactionDate: input.transactionDate, notes: input.notes || null });
}

export async function getMoneyTransactions(userId: number) {
  const db = await getDb();
  return db ? db.select().from(moneyTransactions).where(eq(moneyTransactions.userId, userId)) : [];
}

export async function addOrUpdatePerson(userId: number, name: string, type: "receivable" | "payable" | "both") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [existing] = await db.select().from(persons).where(and(eq(persons.userId, userId), eq(persons.name, name))).limit(1);
  if (existing) {
    if (existing.type !== type && existing.type !== "both") await db.update(persons).set({ type: "both" }).where(and(eq(persons.userId, userId), eq(persons.id, existing.id)));
    return existing.id;
  }
  const result = await db.insert(persons).values({ userId, name, type });
  return Number(result[0].insertId);
}
