/**
 * Demo view-model for the home screen. This stands in for real user data +
 * ledger until auth and Turso are wired. It exercises the real @neco/core
 * engine so the numbers on screen are genuinely computed, not hard-coded.
 */

import {
  type Bill,
  type BillAccrual,
  computeSplit,
  dailySafeCap,
  dangerDays,
  formatMoney,
  toMinor,
  type Weekday,
} from "@neco/core";
import { addDays, getWeekday } from "@neco/core";

const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "PHP";
const LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en-PH";

const PAYDAY: Weekday = "MONDAY";
const WEEK_START: Weekday = "MONDAY";

const bills: Bill[] = [
  { id: "netflix", title: "Netflix", monthlyAmount: toMinor(549), dueDayOfMonth: 15 },
  { id: "spotify", title: "Spotify", monthlyAmount: toMinor(199), dueDayOfMonth: 5 },
  { id: "gym", title: "Gym", monthlyAmount: toMinor(1200), dueDayOfMonth: 1 },
  { id: "mobile", title: "Mobile Plan", monthlyAmount: toMinor(999), dueDayOfMonth: 20 },
];

// Pretend the user is partway through funding some bills this cycle.
const accruals: BillAccrual[] = [
  { billId: "netflix", accrued: toMinor(410) },
  { billId: "spotify", accrued: toMinor(199) },
  { billId: "gym", accrued: toMinor(300) },
];

/** End of the current spending week (inclusive), given a week-start weekday. */
function weekEndFrom(today: Date, weekStart: Weekday): Date {
  const order: Weekday[] = [
    "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
  ];
  const startIdx = order.indexOf(weekStart);
  const todayIdx = order.indexOf(getWeekday(today));
  const daysUntilNextStart = ((startIdx - todayIdx + 7) % 7) || 7;
  return addDays(today, daysUntilNextStart - 1);
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

  // Pretend ₱2,300 spent so far this week.
  const spentThisWeek = toMinor(2300);
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

  return {
    currency: CURRENCY,
    locale: LOCALE,
    income,
    split,
    cap,
    spentThisWeek,
    danger,
    billProgress,
    fmt: (m: number) => formatMoney(m, CURRENCY, LOCALE),
  };
}
