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

const PAYDAY: Weekday = "MONDAY";
const WEEK_START: Weekday = "MONDAY";

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

const bills: Bill[] = [
  { id: "netflix", title: "Netflix", monthlyAmount: toMinor(549), dueDayOfMonth: 15 },
  { id: "spotify", title: "Spotify", monthlyAmount: toMinor(199), dueDayOfMonth: 5 },
  { id: "gym", title: "Gym", monthlyAmount: toMinor(1200), dueDayOfMonth: 1 },
  { id: "mobile", title: "Mobile Plan", monthlyAmount: toMinor(999), dueDayOfMonth: 20 },
];

const accruals: BillAccrual[] = [
  { billId: "netflix", accrued: toMinor(410) },
  { billId: "spotify", accrued: toMinor(199) },
  { billId: "gym", accrued: toMinor(300) },
];

// This week's expenses (dayIndex: 0 = Mon … 6 = Sun). Sum = ₱2,300.
type Expense = {
  id: string;
  title: string;
  category: Category;
  amountMajor: number;
  dayIndex: number;
};

const expenses: Expense[] = [
  { id: "e1", title: "Groceries", category: "Groceries", amountMajor: 650, dayIndex: 0 },
  { id: "e2", title: "Morning coffee", category: "Food & Dining", amountMajor: 120, dayIndex: 0 },
  { id: "e3", title: "Jeepney", category: "Transport", amountMajor: 60, dayIndex: 1 },
  { id: "e4", title: "Lunch", category: "Food & Dining", amountMajor: 190, dayIndex: 1 },
  { id: "e5", title: "Dinner out", category: "Food & Dining", amountMajor: 520, dayIndex: 2 },
  { id: "e6", title: "Mobile load", category: "Bills & Utilities", amountMajor: 300, dayIndex: 3 },
  { id: "e7", title: "Pharmacy", category: "Health", amountMajor: 460, dayIndex: 4 },
];

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

export function getDashboard(now: Date = new Date()) {
  const income = toMinor(15000);
  const savingsPct = 0.2;

  const split = computeSplit({
    income,
    bills,
    accruals,
    savingsPct,
    today: now,
    payday: PAYDAY,
  });

  const spentThisWeek = expenses.reduce((s, e) => s + toMinor(e.amountMajor), 0);
  const weekEnd = weekEndFrom(now, WEEK_START);
  const cap = dailySafeCap({
    weeklySafeToSpend: split.safeToSpend,
    spentThisWeek,
    today: now,
    weekEnd,
  });

  const danger = dangerDays(bills, accruals, { today: now, payday: PAYDAY });

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

  // Recent activity — most recent first.
  const activity = [...expenses]
    .sort((a, b) => b.dayIndex - a.dayIndex || b.id.localeCompare(a.id))
    .slice(0, 6)
    .map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      minor: toMinor(e.amountMajor),
      dayLabel: DAY_LABEL[e.dayIndex] ?? "",
    }));

  // Savings vault progress toward a goal.
  const savings = {
    balanceMinor: toMinor(12450),
    goalMinor: toMinor(50000),
    label: "Emergency fund",
    pct: Math.round((12450 / 50000) * 100),
  };

  return {
    currency: CURRENCY,
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
    savings,
    fmt: (m: number) => formatMoney(m, CURRENCY, LOCALE),
  };
}

export type Dashboard = ReturnType<typeof getDashboard>;
