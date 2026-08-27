/**
 * Application-level domain types and category definitions for the web app.
 *
 * These types sit above @neco/core (which owns money/engine types) and
 * describe the shape of the view-model state stored in the browser.
 */

import type { Bill, BillAccrual, Weekday } from "@neco/core";

// ─── Expense categories ──────────────────────────────────────────────────────

export type Category =
  | "Food & Dining"
  | "Transport"
  | "Groceries"
  | "Bills & Utilities"
  | "Health"
  | "Shopping";

export const CATEGORIES: Category[] = [
  "Food & Dining",
  "Transport",
  "Groceries",
  "Bills & Utilities",
  "Health",
  "Shopping",
];

export const ESSENTIAL_CATEGORIES: ReadonlySet<Category> = new Set([
  "Groceries",
  "Transport",
  "Health",
  "Bills & Utilities",
]);

// ─── App state shape ─────────────────────────────────────────────────────────

export type Expense = {
  id: string;
  title: string;
  category: Category;
  amountMajor: number;
  /** 0 = Monday … 6 = Sunday, aligning with the Mon-first week order. */
  dayIndex: number;
  /** Explicit essentiality override for runway baseline burn calculations. */
  isEssential?: boolean;
};

export type Contribution = {
  id: string;
  label: string;
  when: string;
  amountMinor: number;
};

export type Settings = {
  /** Weekly income in minor units. */
  income: number;
  /** 0..1 — fraction of income to sweep into savings on every payday. */
  savingsPct: number;
  /** Minimum floor for weekly essential expenses in minor units. */
  essentialWeeklyBaselineMinor?: number;
  payday: Weekday;
  weekStart: Weekday;
  currency: string;
  billReminders: boolean;
  rolloverEnabled: boolean;
  hasCompletedOnboarding?: boolean;
};

export type SavingsAccount = {
  balanceMinor: number;
  goalMinor: number;
  label: string;
  /** Whether these funds are accessible liquid cash. Defaults to true. */
  isLiquid?: boolean;
};

export type TargetSliders = {
  commuteMajor: number;
  campusMealsMajor: number;
  datesMajor: number;
  snacksMajor: number;
};

export type OnboardingSetupData = {
  incomeWeeklyMajor: number;
  savingsPct: number;
  payday: Weekday;
  bills: Array<{
    id: string;
    title: string;
    amountMajor: number;
    frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUALLY";
    dueDayOfMonth: number;
  }>;
  sliders: TargetSliders;
  savingsGoalMajor?: number;
  liquidSavingsMajor?: number;
};

export type AppState = {
  settings: Settings;
  bills: Bill[];
  accruals: BillAccrual[];
  expenses: Expense[];
  savings: SavingsAccount;
  contributions: Contribution[];
  targetSliders: TargetSliders;
};



