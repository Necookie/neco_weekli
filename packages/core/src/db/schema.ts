/**
 * Drizzle schema for Turso (libSQL / SQLite).
 * Money columns are INTEGER minor units. Balances are never stored — they are
 * folded from the append-only `ledger` table (see ../ledger.ts).
 */

import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  userId: text("user_id").primaryKey(),
  incomeType: text("income_type", { enum: ["FIXED", "VARIABLE"] })
    .notNull()
    .default("FIXED"),
  /** Only set when incomeType = FIXED. Minor units. */
  fixedWeeklyAmount: integer("fixed_weekly_amount"),
  savingsPercentage: real("savings_percentage").notNull().default(0),
  /** Minimum baseline floor for weekly essential expenses. Minor units. */
  essentialWeeklyBaselineMinor: integer("essential_weekly_baseline_minor"),
  paydayWeekday: text("payday_weekday").notNull().default("MONDAY"),
  weekStartWeekday: text("week_start_weekday").notNull().default("MONDAY"),
  currencyCode: text("currency_code").notNull().default("PHP"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const incomeEvents = sqliteTable("income_events", {
  incomeId: text("income_id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.userId),
  /** Minor units. */
  amount: integer("amount").notNull(),
  receivedAt: text("received_at").notNull(),
  isConfirmed: integer("is_confirmed", { mode: "boolean" })
    .notNull()
    .default(true),
});

export const subscriptions = sqliteTable("subscriptions", {
  subscriptionId: text("subscription_id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.userId),
  title: text("title").notNull(),
  /** Recurring cost in minor units. */
  monthlyAmount: integer("monthly_amount").notNull(),
  frequency: text("frequency", {
    enum: ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY"],
  })
    .notNull()
    .default("MONTHLY"),
  dueDayOfMonth: integer("due_day_of_month").notNull(),
  templateKey: text("template_key"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const ledger = sqliteTable("ledger", {
  entryId: text("entry_id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.userId),
  type: text("type", {
    enum: ["INCOME_SPLIT", "EXPENSE", "BILL_PAID", "ROLLOVER", "ADJUSTMENT"],
  }).notNull(),
  vault: text("vault", {
    enum: ["BILLS_RESERVE", "SAVINGS", "SAFE_TO_SPEND"],
  }).notNull(),
  /** Signed minor units. */
  amount: integer("amount").notNull(),
  subscriptionId: text("subscription_id").references(
    () => subscriptions.subscriptionId,
  ),
  expenseId: text("expense_id"),
  occurredAt: text("occurred_at").notNull(),
  /** Idempotency key — unique per user for offline-safe sync. */
  clientGeneratedId: text("client_generated_id").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const expenses = sqliteTable("expenses", {
  expenseId: text("expense_id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.userId),
  /** Minor units. */
  amount: integer("amount").notNull(),
  category: text("category").notNull(),
  isEssential: integer("is_essential", { mode: "boolean" })
    .notNull()
    .default(false),
  vaultSource: text("vault_source", {
    enum: ["BILLS_RESERVE", "SAVINGS", "SAFE_TO_SPEND"],
  })
    .notNull()
    .default("SAFE_TO_SPEND"),
  occurredAt: text("occurred_at").notNull(),
  clientGeneratedId: text("client_generated_id").notNull().unique(),
  syncState: text("sync_state", { enum: ["PENDING", "SYNCED"] })
    .notNull()
    .default("SYNCED"),
});

export type UserRow = typeof users.$inferSelect;
export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type LedgerRow = typeof ledger.$inferSelect;
export type ExpenseRow = typeof expenses.$inferSelect;
export type IncomeEventRow = typeof incomeEvents.$inferSelect;
