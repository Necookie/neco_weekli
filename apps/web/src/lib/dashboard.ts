/**
 * Dashboard view-model computation. Pure function — no I/O, no side-effects.
 *
 * Stands in for real user data + ledger until auth and Turso are wired in.
 * It drives the real @neco/core engine so headline numbers are genuinely
 * computed, not hard-coded.
 */

import {
  addDays,
  computeSplit,
  dailySafeCap,
  dangerDays,
  DAY_LABEL_FULL,
  DAY_LABEL_SHORT,
  formatMoney,
  getWeekday,
  toMinor,
  WEEKDAY_ORDER,
  type Weekday,
} from "@neco/core";
import { LOCALE } from "./seed.ts";
import type { AppState } from "./types.ts";

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Returns the 0-based Monday-first index of `now` in the current week.
 * Monday = 0, Sunday = 6.
 */
function todayIndex(now: Date): number {
  return WEEKDAY_ORDER.indexOf(getWeekday(now));
}

/**
 * Computes the last day (inclusive) of the spending week that contains `today`,
 * given the user-configured `weekStart` weekday.
 */
function weekEndFrom(today: Date, weekStart: Weekday): Date {
  const startIdx = WEEKDAY_ORDER.indexOf(weekStart);
  const todayIdx = WEEKDAY_ORDER.indexOf(getWeekday(today));
  const daysUntilNextStart = ((startIdx - todayIdx + 7) % 7) || 7;
  return addDays(today, daysUntilNextStart - 1);
}

/**
 * Returns a time-of-day greeting string appropriate for the current hour.
 */
function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Returns a stable money-formatter function for the given locale+currency pair.
 * Results are cached so the same `Intl.NumberFormat` instance is reused.
 */
const _fmtFnCache = new Map<string, (m: number) => string>();
function makeFmt(currency: string): (m: number) => string {
  const key = `${LOCALE}:${currency}`;
  let fn = _fmtFnCache.get(key);
  if (!fn) {
    fn = (m: number) => formatMoney(m, currency, LOCALE);
    _fmtFnCache.set(key, fn);
  }
  return fn;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes the full dashboard view-model from mutable {@link AppState}.
 *
 * This is a pure function called on every state change (memoised in the
 * store via `useMemo`). It exercises the @neco/core engine for all money math.
 *
 * @param state - Current application state.
 * @param now   - Reference "now" date; defaults to `new Date()`. Inject in tests.
 * @returns Dashboard view-model ready for rendering.
 */
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
  const perDay = DAY_LABEL_SHORT.map((label, i) => ({
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
      dayLabel: DAY_LABEL_SHORT[e.dayIndex] ?? "",
      dayFullLabel: DAY_LABEL_FULL[e.dayIndex] ?? "",
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
    fmt: makeFmt(currency),
  };
}

export type Dashboard = ReturnType<typeof computeDashboard>;
