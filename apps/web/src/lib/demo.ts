/**
 * Demo view-model for the dashboard. Stands in for real user data + ledger
 * until auth and Turso are wired. It exercises the real @neco/core engine so
 * the headline numbers are genuinely computed, not hard-coded.
 */

import {
  addDays,
  type Bill,
  type BillAccrual,
  computeSplit,
  dailySafeCap,
  dangerDays,
  formatMoney,
  getWeekday,
  toMinor,
  type Weekday,
} from "@neco/core";

const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "PHP";
const LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en-PH";

const WEEK_ORDER: Weekday[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
];
const DAY_LABEL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

export type Expense = {
  id: string;
  title: string;
  category: Category;
  amountMajor: number;
  dayIndex: number;
};

export type Contribution = {
  id: string;
  label: string;
  when: string;
  amountMinor: number;
};

export type Settings = {
  income: number;
  savingsPct: number;
  payday: Weekday;
  weekStart: Weekday;
  currency: string;
  billReminders: boolean;
  rolloverEnabled: boolean;
};

export type AppState = {
  settings: Settings;
  bills: Bill[];
  accruals: BillAccrual[];
  expenses: Expense[];
  savings: { balanceMinor: number; goalMinor: number; label: string };
  contributions: Contribution[];
};

export const DEFAULT_SETTINGS: Settings = {
  income: toMinor(15000),
  savingsPct: 0.2,
  payday: "MONDAY",
  weekStart: "MONDAY",
  currency: CURRENCY,
  billReminders: true,
  rolloverEnabled: true,
};

const DEFAULT_BILLS: Bill[] = [
  { id: "netflix", title: "Netflix", monthlyAmount: toMinor(549), dueDayOfMonth: 15 },
  { id: "spotify", title: "Spotify", monthlyAmount: toMinor(199), dueDayOfMonth: 5 },
  { id: "gym", title: "Gym", monthlyAmount: toMinor(1200), dueDayOfMonth: 1 },
  { id: "mobile", title: "Mobile Plan", monthlyAmount: toMinor(999), dueDayOfMonth: 20 },
];

const DEFAULT_ACCRUALS: BillAccrual[] = [
  { billId: "netflix", accrued: toMinor(410) },
  { billId: "spotify", accrued: toMinor(199) },
  { billId: "gym", accrued: toMinor(300) },
];

// This week's expenses (dayIndex: 0 = Mon … 6 = Sun). Sum = ₱2,300.
const DEFAULT_EXPENSES: Expense[] = [
  { id: "e1", title: "Groceries", category: "Groceries", amountMajor: 650, dayIndex: 0 },
  { id: "e2", title: "Morning coffee", category: "Food & Dining", amountMajor: 120, dayIndex: 0 },
  { id: "e3", title: "Jeepney", category: "Transport", amountMajor: 60, dayIndex: 1 },
  { id: "e4", title: "Lunch", category: "Food & Dining", amountMajor: 190, dayIndex: 1 },
  { id: "e5", title: "Dinner out", category: "Food & Dining", amountMajor: 520, dayIndex: 2 },
  { id: "e6", title: "Mobile load", category: "Bills & Utilities", amountMajor: 300, dayIndex: 3 },
  { id: "e7", title: "Pharmacy", category: "Health", amountMajor: 460, dayIndex: 4 },
];

export const DEFAULT_STATE: AppState = {
  settings: DEFAULT_SETTINGS,
  bills: DEFAULT_BILLS,
  accruals: DEFAULT_ACCRUALS,
  expenses: DEFAULT_EXPENSES,
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

function todayIndex(now: Date): number {
  return WEEK_ORDER.indexOf(getWeekday(now));
}

function weekEndFrom(today: Date, weekStart: Weekday): Date {
  const startIdx = WEEK_ORDER.indexOf(weekStart);
  const todayIdx = WEEK_ORDER.indexOf(getWeekday(today));
  const daysUntilNextStart = ((startIdx - todayIdx + 7) % 7) || 7;
  return addDays(today, daysUntilNextStart - 1);
}

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Computes the dashboard view-model from mutable app state. Pure function. */
export function computeDashboard(state: AppState, now: Date = new Date()) {
  const { settings, bills, accruals, expenses, savings, contributions } = state;
  const { income, savingsPct, payday, weekStart, currency } = settings;

  const split = computeSplit({ income, bills, accruals, savingsPct, today: now, payday });

  const spentThisWeek = expenses.reduce((s, e) => s + toMinor(e.amountMajor), 0);
  const weekEnd = weekEndFrom(now, weekStart);
  const cap = dailySafeCap({
    weeklySafeToSpend: split.safeToSpend,
    spentThisWeek,
    today: now,
    weekEnd,
  });

  const danger = dangerDays(bills, accruals, { today: now, payday });

  const accrualMap = new Map(accruals.map((a) => [a.billId, a.accrued]));
  const billProgress = bills.map((b) => ({
    ...b,
    accrued: Math.min(b.monthlyAmount, accrualMap.get(b.id) ?? 0),
    pct: Math.min(
      100,
      Math.round(((accrualMap.get(b.id) ?? 0) / b.monthlyAmount) * 100),
    ),
  }));

  // Per-day spend for the week bar chart.
  const tIdx = todayIndex(now);
  const perDay = DAY_LABEL.map((label, i) => ({
    label,
    minor: expenses
      .filter((e) => e.dayIndex === i)
      .reduce((s, e) => s + toMinor(e.amountMajor), 0),
    isToday: i === tIdx,
    isFuture: i > tIdx,
  }));
  const maxDay = Math.max(1, ...perDay.map((d) => d.minor));

  // Activity — most recent first. Cards slice to what they need.
  const activity = [...expenses]
    .sort((a, b) => b.dayIndex - a.dayIndex || b.id.localeCompare(a.id))
    .map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      minor: toMinor(e.amountMajor),
      dayLabel: DAY_LABEL[e.dayIndex] ?? "",
      dayIndex: e.dayIndex,
    }));

  const savingsPctDone =
    savings.goalMinor > 0
      ? Math.round((savings.balanceMinor / savings.goalMinor) * 100)
      : 0;

  return {
    currency,
    locale: LOCALE,
    greeting: greeting(now),
    income,
    savingsPct,
    split,
    cap,
    spentThisWeek,
    danger,
    billProgress,
    weekSpend: { perDay, maxDay },
    activity,
    savings: { ...savings, pct: savingsPctDone },
    contributions,
    fmt: (m: number) => formatMoney(m, currency, LOCALE),
  };
}

export type Dashboard = ReturnType<typeof computeDashboard>;
