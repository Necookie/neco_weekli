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
    { id: "netflix", title: "Netflix", monthlyAmount: toMinor(549), dueDayOfMonth: 15 },
    { id: "spotify", title: "Spotify", monthlyAmount: toMinor(199), dueDayOfMonth: 5 },
    { id: "gym", title: "Gym", monthlyAmount: toMinor(1200), dueDayOfMonth: 1 },
    { id: "mobile", title: "Mobile Plan", monthlyAmount: toMinor(999), dueDayOfMonth: 20 },
  ],
  accruals: [
    { billId: "netflix", accrued: toMinor(410) },
    { billId: "spotify", accrued: toMinor(199) },
    { billId: "gym", accrued: toMinor(300) },
  ],
  // This week's expenses (dayIndex: 0 = Mon … 6 = Sun). Sum ≈ ₱2,300.
  expenses: [
    { id: "e1", title: "Groceries", category: "Groceries", amountMajor: 650, dayIndex: 0 },
    { id: "e2", title: "Morning coffee", category: "Food & Dining", amountMajor: 120, dayIndex: 0 },
    { id: "e3", title: "Jeepney", category: "Transport", amountMajor: 60, dayIndex: 1 },
    { id: "e4", title: "Lunch", category: "Food & Dining", amountMajor: 190, dayIndex: 1 },
    { id: "e5", title: "Dinner out", category: "Food & Dining", amountMajor: 520, dayIndex: 2 },
    { id: "e6", title: "Mobile load", category: "Bills & Utilities", amountMajor: 300, dayIndex: 3 },
    { id: "e7", title: "Pharmacy", category: "Health", amountMajor: 460, dayIndex: 4 },
  ],
  savings: {
    balanceMinor: toMinor(12450),
    goalMinor: toMinor(50000),
    label: "Emergency fund",
  },
  contributions: [
    { id: "h1", label: "Payday allocation", when: "This Mon", amountMinor: toMinor(3000) },
    { id: "h2", label: "Week rollover", when: "Last Sun", amountMinor: toMinor(180) },
    { id: "h3", label: "Payday allocation", when: "Last Mon", amountMinor: toMinor(3000) },
    { id: "h4", label: "Manual top-up", when: "2 weeks ago", amountMinor: toMinor(500) },
  ],
};
