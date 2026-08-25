import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, uniqueIndex } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// People table to track names for receivables and payables
export const persons = mysqlTable("persons", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["receivable", "payable", "both"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userNameUnique: uniqueIndex("persons_user_name_unique").on(table.userId, table.name),
}));

export type Person = typeof persons.$inferSelect;
export type InsertPerson = typeof persons.$inferInsert;

// Receivables (Pabo - পাওনা) transactions / accounts
export const receivables = mysqlTable("receivables", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  personId: int("personId").notNull(),
  personName: varchar("personName", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: mysqlEnum("currency", ["BDT", "SR"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Receivable = typeof receivables.$inferSelect;
export type InsertReceivable = typeof receivables.$inferInsert;

// Payables (Dibo - দেনা) transactions / accounts
export const payables = mysqlTable("payables", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  personId: int("personId").notNull(),
  personName: varchar("personName", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: mysqlEnum("currency", ["BDT", "SR"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payable = typeof payables.$inferSelect;
export type InsertPayable = typeof payables.$inferInsert;

// Properties table
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  budget: decimal("budget", { precision: 14, scale: 2 }).notNull(),
  currency: mysqlEnum("currency", ["BDT", "SR"]).default("BDT").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userNameUnique: uniqueIndex("properties_user_name_unique").on(table.userId, table.name),
}));

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

// Property itemized payments
export const propertyPayments = mysqlTable("property_payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  propertyId: int("propertyId").notNull(),
  propertyName: varchar("propertyName", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: varchar("paymentDate", { length: 64 }).notNull(), // e.g. "13 Apr" or "2026-04-13"
  currency: mysqlEnum("currency", ["BDT", "SR"]).default("BDT").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PropertyPayment = typeof propertyPayments.$inferSelect;
export type InsertPropertyPayment = typeof propertyPayments.$inferInsert;

// Immutable transaction history for money received from receivables and money paid toward payables.
export const moneyTransactions = mysqlTable("money_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  personId: int("personId").notNull(),
  personName: varchar("personName", { length: 255 }).notNull(),
  kind: mysqlEnum("kind", ["receivable_received", "payable_paid"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: mysqlEnum("currency", ["BDT", "SR"]).notNull(),
  transactionDate: varchar("transactionDate", { length: 64 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MoneyTransaction = typeof moneyTransactions.$inferSelect;
export type InsertMoneyTransaction = typeof moneyTransactions.$inferInsert;

// Google Sheets configuration and sync log (optional)
export const sheetSyncConfig = mysqlTable("sheet_sync_config", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  apiKey: text("apiKey"),
  spreadsheetId: text("spreadsheetId"),
  webhookUrl: text("webhookUrl"),
  lastSyncedAt: timestamp("lastSyncedAt"),
  syncStatus: varchar("syncStatus", { length: 64 }).default("idle"),
  lastError: text("lastError"),
});

export type SheetSyncConfig = typeof sheetSyncConfig.$inferSelect;
export type InsertSheetSyncConfig = typeof sheetSyncConfig.$inferInsert;
