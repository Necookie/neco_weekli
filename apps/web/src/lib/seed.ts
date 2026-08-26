/**
 * Default seed data for the demo / local-storage mode.
 *
 * These fixtures exercise the real @neco/core engine so headline numbers are
 * genuinely computed, not hard-coded. They also serve as the reset target when
 * the user signs out.
 */

import { toMinor } from "@neco/core";
import type { AppState, Settings } from "./types.ts";

// ─── Env-driven locale / currency ────────────────────────────────────────────

export const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "PHP";
export const LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en-PH";

// ─── Default settings ─────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Settings = {
  income: toMinor(15000),
  savingsPct: 0.2,
  essentialWeeklyBaselineMinor: toMinor(2000),
  payday: "MONDAY",
  weekStart: "MONDAY",
  currency: CURRENCY,
  billReminders: true,
  rolloverEnabled: true,
};

// ─── Default state ────────────────────────────────────────────────────────────

export const DEFAULT_STATE: AppState = {
  settings: DEFAULT_SETTINGS,
  bills: [
    { id: "netflix", title: "Netflix", monthlyAmount: toMinor(549), frequency: "MONTHLY", dueDayOfMonth: 15 },
    { id: "spotify", title: "Spotify", monthlyAmount: toMinor(199), frequency: "MONTHLY", dueDayOfMonth: 5 },
    { id: "gym", title: "Gym Membership", monthlyAmount: toMinor(700), frequency: "MONTHLY", dueDayOfMonth: 1 },
    { id: "cloud", title: "Cloud Storage", monthlyAmount: toMinor(1200), frequency: "ANNUALLY", dueDayOfMonth: 10 },
    { id: "mobile", title: "Mobile Plan", monthlyAmount: toMinor(999), frequency: "MONTHLY", dueDayOfMonth: 20 },
  ],
  accruals: [
    { billId: "netflix", accrued: toMinor(410) },
    { billId: "spotify", accrued: toMinor(199) },
    { billId: "gym", accrued: toMinor(350) },
    { billId: "cloud", accrued: toMinor(600) },
  ],
  // This week's expenses (dayIndex: 0 = Mon … 6 = Sun).
  expenses: [
    { id: "e1", title: "Groceries", category: "Groceries", amountMajor: 650, dayIndex: 0, isEssential: true },
    { id: "e2", title: "Morning coffee", category: "Food & Dining", amountMajor: 120, dayIndex: 0, isEssential: false },
    { id: "e3", title: "Jeepney & Commute", category: "Transport", amountMajor: 80, dayIndex: 1, isEssential: true },
    { id: "e4", title: "Campus Lunch", category: "Food & Dining", amountMajor: 190, dayIndex: 1, isEssential: true },
    { id: "e5", title: "Dinner out with friends", category: "Food & Dining", amountMajor: 520, dayIndex: 2, isEssential: false },
    { id: "e6", title: "Mobile load data", category: "Bills & Utilities", amountMajor: 300, dayIndex: 3, isEssential: true },
    { id: "e7", title: "Pharmacy / Meds", category: "Health", amountMajor: 460, dayIndex: 4, isEssential: true },
  ],
  savings: {
    balanceMinor: toMinor(28450),
    goalMinor: toMinor(50000),
    label: "Emergency fund",
    isLiquid: true,
  },
  contributions: [
    { id: "h1", label: "Payday allocation", when: "This Mon", amountMinor: toMinor(3000) },
    { id: "h2", label: "Week rollover", when: "Last Sun", amountMinor: toMinor(180) },
    { id: "h3", label: "Payday allocation", when: "Last Mon", amountMinor: toMinor(3000) },
    { id: "h4", label: "Manual top-up", when: "2 weeks ago", amountMinor: toMinor(500) },
  ],
};

