/**
 * Dashboard view-model computation. Pure function — no I/O, no side-effects.
 *
 * Stands in for real user data + ledger until auth and Turso are wired in.
 * It drives the real @neco/core engine so headline numbers are genuinely
 * computed, not hard-coded.
 */

import {
  addDays,
  calculateBaselineBurn,
  calculateRunway,
  calculateTimeImpact,
  computeSplit,
  dailySafeCap,
  dangerDays,
  DAY_LABEL_FULL,
  DAY_LABEL_SHORT,
  formatMoney,
  getWeekday,
  normalizeToWeekly,
  toMinor,
  WEEKDAY_ORDER,
  type Weekday,
} from "@neco/core";
import { LOCALE } from "./seed.ts";
import { ESSENTIAL_CATEGORIES, type AppState } from "./types.ts";

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
  const { income, savingsPct, payday, weekStart, currency, essentialWeeklyBaselineMinor } = settings;

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

  // ─── Runway & Baseline Burn Engine ──────────────────────────────────────────
  const essentialExpenseWeekly = expenses.reduce((sum, e) => {
    const isEssential = e.isEssential ?? ESSENTIAL_CATEGORIES.has(e.category);
    return isEssential ? sum + toMinor(e.amountMajor) : sum;
  }, 0);

  const baselineBurn = calculateBaselineBurn({
    bills,
    essentialExpenseWeekly,
    baselineFloorWeekly: essentialWeeklyBaselineMinor,
  });

  // Accessible liquid pool: Liquid savings + Remaining safe-to-spend this cycle
  const liquidSavings = savings.isLiquid !== false ? savings.balanceMinor : 0;
  const liquidPool = liquidSavings + Math.max(0, cap.remaining);

  const runway = calculateRunway({
    liquidPoolMinor: liquidPool,
    weeklyBurn: baselineBurn.totalWeekly,
  });

  const accrualMap = new Map(accruals.map((a) => [a.billId, a.accrued]));
  const billProgress = bills.map((b) => {
    const frequency = b.frequency ?? "MONTHLY";
    const weeklyBurn = normalizeToWeekly(b.monthlyAmount, frequency);
    return {
      ...b,
      frequency,
      weeklyBurn,
      accrued: Math.min(b.monthlyAmount, accrualMap.get(b.id) ?? 0),
      pct: Math.min(
        100,
        Math.round(((accrualMap.get(b.id) ?? 0) / b.monthlyAmount) * 100),
      ),
    };
  });

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

  // Activity — annotated with real-time Time Impact consequence.
  const activity = [...expenses]
    .sort((a, b) => b.dayIndex - a.dayIndex || b.id.localeCompare(a.id))
    .map((e) => {
      const isEssential = e.isEssential ?? ESSENTIAL_CATEGORIES.has(e.category);
      const minor = toMinor(e.amountMajor);
      const timeImpact = calculateTimeImpact(-minor, baselineBurn.totalDaily, {
        isEssential,
      });

      return {
        id: e.id,
        title: e.title,
        category: e.category,
        isEssential,
        minor,
        timeImpact,
        dayLabel: DAY_LABEL_SHORT[e.dayIndex] ?? "",
        dayFullLabel: DAY_LABEL_FULL[e.dayIndex] ?? "",
        dayIndex: e.dayIndex,
      };
    });

  // Savings contributions annotated with time impact (positive runway addition)
  const annotatedContributions = contributions.map((c) => ({
    ...c,
    timeImpact: calculateTimeImpact(c.amountMinor, baselineBurn.totalDaily),
  }));

  // ─── Interactive Slider Simulation Engine ──────────────────────────────────
  const sliders = state.targetSliders ?? {
    commuteMajor: 350,
    campusMealsMajor: 500,
    datesMajor: 400,
    snacksMajor: 150,
  };
  const totalSlidersSpendMinor = toMinor(
    sliders.commuteMajor +
      sliders.campusMealsMajor +
      sliders.datesMajor +
      sliders.snacksMajor,
  );
  const slidersEssentialMinor = toMinor(
    sliders.commuteMajor + sliders.campusMealsMajor,
  );
  const slidersDiscretionaryMinor = toMinor(
    sliders.datesMajor + sliders.snacksMajor,
  );

  // Simulated total weekly burn under these spending targets
  const simulatedWeeklyBurn = baselineBurn.billsWeekly + totalSlidersSpendMinor;
  const simulatedRunway = calculateRunway({
    liquidPoolMinor: liquidPool,
    weeklyBurn: simulatedWeeklyBurn,
  });

  // Net weekly build rate / surplus: Safe-to-Spend minus Target Allocations
  const surplusMinor = split.safeToSpend - totalSlidersSpendMinor;

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
    baselineBurn,
    liquidPool,
    runway,
    sliderSimulation: {
      sliders,
      totalSlidersSpendMinor,
      slidersEssentialMinor,
      slidersDiscretionaryMinor,
      surplusMinor,
      projectedWeeks: simulatedRunway.weeks,
      projectedDays: simulatedRunway.days,
      simulatedRunway,
    },
    weekSpend: { perDay, maxDay },
    activity,
    savings: { ...savings, pct: savingsPctDone },
    contributions: annotatedContributions,
    fmt: makeFmt(currency),
  };
}

export type Dashboard = ReturnType<typeof computeDashboard>;


