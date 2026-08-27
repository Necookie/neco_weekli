/**
 * Turso-backed persistence for signed-in users. Server-only — never import
 * this from a client component. Every function is scoped by an explicit
 * `userId` (the caller — apps/web/src/lib/server/actions.ts — is responsible
 * for sourcing that id from Clerk's `auth()`, never from client input).
 *
 * Maps between the Drizzle rows in @neco/core/schema (ledger-derived
 * balances, per SRS §3.4) and the AppState view-model shape store.tsx
 * already knows how to render, so the client-side store doesn't need to
 * change shape based on where its data came from.
 */

import { randomUUID } from "node:crypto";
import { and, eq, gte, lt } from "drizzle-orm";
import {
  addDays,
  type Bill,
  type BillAccrual,
  foldLedger,
  type LedgerEntry,
  type RecurrenceFrequency,
  toMinor,
  type Weekday,
  weekdayIndexFrom,
  weekRange,
} from "@neco/core";
import { db, schema } from "@neco/core/db";
import type {
  AppState,
  Category,
  Contribution,
  Expense,
  OnboardingSetupData,
  Settings,
} from "../types.ts";
import { CLEAN_INITIAL_STATE, DEFAULT_TARGET_SLIDERS } from "../seed.ts";

const MAX_CONTRIBUTIONS = 50;

// ─── users row ────────────────────────────────────────────────────────────────

/** Ensures a `users` row exists for `userId`, then returns it. Idempotent. */
async function getOrCreateUser(userId: string) {
  await db.insert(schema.users).values({ userId }).onConflictDoNothing();
  const [row] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.userId, userId));
  if (!row) {
    throw new Error(`Failed to create or load user row for ${userId}`);
  }
  return row;
}

function settingsFromRow(row: Awaited<ReturnType<typeof getOrCreateUser>>): Settings {
  return {
    income: row.fixedWeeklyAmount ?? 0,
    savingsPct: row.savingsPercentage,
    essentialWeeklyBaselineMinor: row.essentialWeeklyBaselineMinor ?? undefined,
    payday: row.paydayWeekday as Weekday,
    weekStart: row.weekStartWeekday as Weekday,
    currency: row.currencyCode,
    billReminders: row.billRemindersEnabled,
    rolloverEnabled: row.rolloverEnabled,
    hasCompletedOnboarding: row.hasCompletedOnboarding,
  };
}

// ─── full state load ─────────────────────────────────────────────────────────

/**
 * Loads everything computeDashboard() needs for `userId`, in the shape
 * store.tsx already renders. Creates the user's row on first load (defaults
 * to an un-onboarded, empty state) but does not create any financial data —
 * that only happens once the user actually completes onboarding or performs
 * an action.
 */
export async function loadAppState(userId: string): Promise<AppState> {
  const userRow = await getOrCreateUser(userId);
  const settings = settingsFromRow(userRow);

  if (!settings.hasCompletedOnboarding) {
    // Nothing meaningful to load yet — avoid extra queries for a brand-new user.
    return { ...CLEAN_INITIAL_STATE, settings };
  }

  const [subscriptionRows, ledgerRows, expenseRows] = await Promise.all([
    db
      .select()
      .from(schema.subscriptions)
      .where(
        and(
          eq(schema.subscriptions.userId, userId),
          eq(schema.subscriptions.isActive, true),
        ),
      ),
    db.select().from(schema.ledger).where(eq(schema.ledger.userId, userId)),
    (() => {
      const { start, end } = weekRange(new Date(), settings.weekStart);
      return db
        .select()
        .from(schema.expenses)
        .where(
          and(
            eq(schema.expenses.userId, userId),
            gte(schema.expenses.occurredAt, start.toISOString()),
            lt(schema.expenses.occurredAt, addDays(end, 1).toISOString()),
          ),
        );
    })(),
  ]);

  const bills: Bill[] = subscriptionRows.map((s) => ({
    id: s.subscriptionId,
    title: s.title,
    monthlyAmount: s.monthlyAmount,
    frequency: s.frequency as RecurrenceFrequency,
    dueDayOfMonth: s.dueDayOfMonth,
  }));

  const ledgerEntries: LedgerEntry[] = ledgerRows.map((l) => ({
    entryId: l.entryId,
    userId: l.userId,
    type: l.type,
    vault: l.vault,
    amount: l.amount,
    occurredAt: l.occurredAt,
    clientGeneratedId: l.clientGeneratedId,
  }));

  // Per-bill accrual = sum of BILLS_RESERVE ledger entries tagged with that
  // subscription (foldLedger only groups by vault, so group manually here).
  const accrualBySub = new Map<string, number>();
  for (let i = 0; i < ledgerRows.length; i++) {
    const row = ledgerRows[i]!;
    if (row.vault !== "BILLS_RESERVE" || !row.subscriptionId) continue;
    accrualBySub.set(
      row.subscriptionId,
      (accrualBySub.get(row.subscriptionId) ?? 0) + row.amount,
    );
  }
  const accruals: BillAccrual[] = bills.map((b) => ({
    billId: b.id,
    accrued: accrualBySub.get(b.id) ?? 0,
  }));

  const balances = foldLedger(ledgerEntries);

  const contributions: Contribution[] = ledgerRows
    .filter((l) => l.vault === "SAVINGS" && l.amount > 0)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, MAX_CONTRIBUTIONS)
    .map((l) => ({
      id: l.entryId,
      label: l.note ?? "Contribution",
      when: new Date(l.occurredAt).toLocaleDateString(),
      amountMinor: l.amount,
    }));

  // The `expenses` table has no free-text title column — the title the user
  // typed only exists on the matching ledger EXPENSE entry's `note`, so join
  // against that (each persisted expense writes exactly one such entry).
  const expenseTitleById = new Map<string, string>();
  for (const l of ledgerRows) {
    if (l.type === "EXPENSE" && l.expenseId && l.note) {
      expenseTitleById.set(l.expenseId, l.note);
    }
  }

  const expenses: Expense[] = expenseRows.map((e) => ({
    id: e.expenseId,
    title: expenseTitleById.get(e.expenseId) ?? e.category,
    category: e.category as Category,
    amountMajor: e.amount / 100,
    dayIndex: weekdayIndexFrom(new Date(e.occurredAt), settings.weekStart),
    isEssential: e.isEssential,
  }));

  return {
    settings,
    bills,
    accruals,
    expenses,
    savings: {
      balanceMinor: balances.SAVINGS,
      goalMinor: userRow.savingsGoalMinor,
      label: userRow.savingsLabel,
      isLiquid: true,
    },
    contributions,
    targetSliders: DEFAULT_TARGET_SLIDERS,
  };
}

// ─── mutations ────────────────────────────────────────────────────────────────

export async function persistOnboarding(
  userId: string,
  data: OnboardingSetupData,
): Promise<void> {
  const existing = await getOrCreateUser(userId);
  const isFirstTimeOnboarding = !existing.hasCompletedOnboarding;

  await db
    .update(schema.users)
    .set({
      incomeType: "FIXED",
      fixedWeeklyAmount: toMinor(data.incomeWeeklyMajor),
      savingsPercentage: data.savingsPct,
      paydayWeekday: data.payday,
      hasCompletedOnboarding: true,
      savingsGoalMinor: toMinor(data.savingsGoalMajor ?? 30000),
      savingsLabel: "Emergency & Runway Fund",
    })
    .where(eq(schema.users.userId, userId));

  // Onboarding can be replayed (Settings -> "Replay Onboarding Wizard") and
  // always represents a full replacement of the bill list — deactivate
  // whatever was active before so replaying doesn't double up subscriptions.
  await db
    .update(schema.subscriptions)
    .set({ isActive: false })
    .where(
      and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.isActive, true),
      ),
    );

  if (data.bills.length > 0) {
    // Onboarding bill presets reuse static ids (e.g. "netflix") across every
    // user who picks them — never trust a client-supplied id as the DB
    // primary key here, or two users picking the same preset would collide.
    await db.insert(schema.subscriptions).values(
      data.bills.map((b) => ({
        subscriptionId: randomUUID(),
        userId,
        title: b.title,
        monthlyAmount: toMinor(b.amountMajor),
        frequency: b.frequency,
        dueDayOfMonth: b.dueDayOfMonth,
      })),
    );
  }

  // The ledger is append-only, so a *replayed* onboarding (Settings ->
  // "Replay Onboarding Wizard") must not re-deposit the initial pool on top
  // of whatever the user has already accumulated — only seed it the first
  // time this user ever completes onboarding.
  const liquidMinor = toMinor(data.liquidSavingsMajor ?? 5000);
  if (isFirstTimeOnboarding && liquidMinor > 0) {
    await db.insert(schema.ledger).values({
      entryId: randomUUID(),
      userId,
      type: "ADJUSTMENT",
      vault: "SAVINGS",
      amount: liquidMinor,
      note: "Initial runway pool",
      occurredAt: new Date().toISOString(),
      clientGeneratedId: randomUUID(),
    });
  }
}

export async function persistBill(
  userId: string,
  input: {
    title: string;
    monthlyAmountMajor: number;
    frequency: RecurrenceFrequency;
    dueDayOfMonth: number;
  },
): Promise<void> {
  await getOrCreateUser(userId);
  await db.insert(schema.subscriptions).values({
    subscriptionId: randomUUID(),
    userId,
    title: input.title,
    monthlyAmount: toMinor(input.monthlyAmountMajor),
    frequency: input.frequency,
    dueDayOfMonth: input.dueDayOfMonth,
  });
}

export async function persistExpense(
  userId: string,
  input: {
    title: string;
    category: Category;
    amountMajor: number;
    dayIndex: number;
    isEssential?: boolean;
  },
): Promise<void> {
  const userRow = await getOrCreateUser(userId);
  const weekStart = userRow.weekStartWeekday as Weekday;
  const { start } = weekRange(new Date(), weekStart);
  const occurredAt = addDays(start, input.dayIndex).toISOString();
  const amountMinor = toMinor(input.amountMajor);
  const expenseId = randomUUID();

  await db.insert(schema.expenses).values({
    expenseId,
    userId,
    amount: amountMinor,
    category: input.category,
    isEssential: input.isEssential ?? false,
    vaultSource: "SAFE_TO_SPEND",
    occurredAt,
    clientGeneratedId: randomUUID(),
  });

  await db.insert(schema.ledger).values({
    entryId: randomUUID(),
    userId,
    type: "EXPENSE",
    vault: "SAFE_TO_SPEND",
    amount: -amountMinor,
    expenseId,
    note: input.title,
    occurredAt,
    clientGeneratedId: randomUUID(),
  });
}

export async function persistMoney(
  userId: string,
  amountMajor: number,
): Promise<void> {
  await getOrCreateUser(userId);
  await db.insert(schema.ledger).values({
    entryId: randomUUID(),
    userId,
    type: "ADJUSTMENT",
    vault: "SAVINGS",
    amount: toMinor(amountMajor),
    note: "Manual top-up",
    occurredAt: new Date().toISOString(),
    clientGeneratedId: randomUUID(),
  });
}

/**
 * Permanently erases every row this user owns — subscriptions, expenses,
 * ledger entries, income events, and the `users` row itself. Called both
 * from the in-app "Delete Account" action and from the Clerk `user.deleted`
 * webhook, so an account removed either way (in-app, or directly through
 * Clerk's own account portal/dashboard) never leaves orphaned Turso rows
 * behind. Idempotent — safe to call for a userId with no rows.
 */
export async function deleteUser(userId: string): Promise<void> {
  await db.delete(schema.ledger).where(eq(schema.ledger.userId, userId));
  await db.delete(schema.expenses).where(eq(schema.expenses.userId, userId));
  await db.delete(schema.subscriptions).where(eq(schema.subscriptions.userId, userId));
  await db.delete(schema.incomeEvents).where(eq(schema.incomeEvents.userId, userId));
  await db.delete(schema.users).where(eq(schema.users.userId, userId));
}

export async function persistSettings(
  userId: string,
  partial: Partial<Settings>,
): Promise<void> {
  await getOrCreateUser(userId);

  const set: Partial<typeof schema.users.$inferInsert> = {};
  if (partial.income !== undefined) set.fixedWeeklyAmount = partial.income;
  if (partial.savingsPct !== undefined) set.savingsPercentage = partial.savingsPct;
  if (partial.essentialWeeklyBaselineMinor !== undefined) {
    set.essentialWeeklyBaselineMinor = partial.essentialWeeklyBaselineMinor;
  }
  if (partial.payday !== undefined) set.paydayWeekday = partial.payday;
  if (partial.weekStart !== undefined) set.weekStartWeekday = partial.weekStart;
  if (partial.currency !== undefined) set.currencyCode = partial.currency;
  if (partial.billReminders !== undefined) set.billRemindersEnabled = partial.billReminders;
  if (partial.rolloverEnabled !== undefined) set.rolloverEnabled = partial.rolloverEnabled;
  if (partial.hasCompletedOnboarding !== undefined) {
    set.hasCompletedOnboarding = partial.hasCompletedOnboarding;
  }

  if (Object.keys(set).length === 0) return;
  await db.update(schema.users).set(set).where(eq(schema.users.userId, userId));
}
