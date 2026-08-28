/**
 * Pure calculation engine for recurring commitment normalization and runway metrics.
 *
 * Normalizes any bill frequency into a weekly and daily baseline burn rate,
 * and derives real-time financial runway (units of time: weeks & days) from
 * accessible liquid funds.
 */

import type { Money } from "./money.ts";

// ─── Frequency Definitions ───────────────────────────────────────────────────

export type RecurrenceFrequency =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "ANNUALLY";

export const FREQUENCY_LABEL: Record<RecurrenceFrequency, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUALLY: "Annually",
};

export const FREQUENCY_WEEKS_DIVISOR: Record<RecurrenceFrequency, number> = {
  WEEKLY: 1,
  BIWEEKLY: 2,
  MONTHLY: 52 / 12, // ~4.333 weeks/mo -> (amount * 12) / 52
  QUARTERLY: 52 / 4, // 13 weeks/quarter -> (amount * 4) / 52
  ANNUALLY: 52, // 52 weeks/year -> amount / 52
};

// ─── Normalization Math ──────────────────────────────────────────────────────

/**
 * Annualize a recurring amount in minor units based on its frequency.
 */
export function annualizeAmount(
  amount: Money,
  frequency: RecurrenceFrequency = "MONTHLY",
): Money {
  switch (frequency) {
    case "WEEKLY":
      return amount * 52;
    case "BIWEEKLY":
      return amount * 26;
    case "MONTHLY":
      return amount * 12;
    case "QUARTERLY":
      return amount * 4;
    case "ANNUALLY":
      return amount;
  }
}

/**
 * Normalizes any recurring amount into its equivalent weekly burn rate (minor units).
 * Uses exact operational formula:
 * - WEEKLY: amount
 * - BIWEEKLY: amount / 2
 * - MONTHLY: (amount * 12) / 52
 * - QUARTERLY: (amount * 4) / 52
 * - ANNUALLY: amount / 52
 */
export function normalizeToWeekly(
  amount: Money,
  frequency: RecurrenceFrequency = "MONTHLY",
): Money {
  switch (frequency) {
    case "WEEKLY":
      return amount;
    case "BIWEEKLY":
      return Math.round(amount / 2);
    case "MONTHLY":
      return Math.round((amount * 12) / 52);
    case "QUARTERLY":
      return Math.round((amount * 4) / 52);
    case "ANNUALLY":
      return Math.round(amount / 52);
  }
}

/**
 * Normalizes any recurring amount into its equivalent daily burn rate (minor units).
 * Defined as weeklyBurn / 7.
 */
export function normalizeToDaily(
  amount: Money,
  frequency: RecurrenceFrequency = "MONTHLY",
): Money {
  const weekly = normalizeToWeekly(amount, frequency);
  return Math.round(weekly / 7);
}

// ─── Baseline Burn Rate ───────────────────────────────────────────────────────

export interface BaselineBillItem {
  monthlyAmount: Money;
  frequency?: RecurrenceFrequency;
}

export interface BaselineBurnInput {
  bills: BaselineBillItem[];
  /** Actual or tracked weekly essential spend (e.g. groceries, commute). */
  essentialExpenseWeekly?: Money;
  /** Configured minimum safety floor for essential expenses. */
  baselineFloorWeekly?: Money;
}

export interface BaselineBurnResult {
  billsWeekly: Money;
  billsDaily: Money;
  essentialWeekly: Money;
  essentialDaily: Money;
  totalWeekly: Money;
  totalDaily: Money;
}

/**
 * Calculates normalized weekly and daily burn from a list of recurring bills.
 */
export function calculateNormalizedBillsBurn(bills: BaselineBillItem[]): {
  weekly: Money;
  daily: Money;
} {
  const weekly = bills.reduce(
    (sum, bill) => sum + normalizeToWeekly(bill.monthlyAmount, bill.frequency ?? "MONTHLY"),
    0,
  );
  return {
    weekly,
    daily: Math.round(weekly / 7),
  };
}

/**
 * Calculates the total baseline burn rate combining normalized recurring bills
 * and essential survival expenses (commute, meals/groceries) or a safety floor.
 */
export function calculateBaselineBurn(input: BaselineBurnInput): BaselineBurnResult {
  const billsBurn = calculateNormalizedBillsBurn(input.bills);
  const trackedEssential = input.essentialExpenseWeekly ?? 0;
  const floorEssential = input.baselineFloorWeekly ?? 0;
  const essentialWeekly = Math.max(trackedEssential, floorEssential);
  const essentialDaily = Math.round(essentialWeekly / 7);

  const totalWeekly = billsBurn.weekly + essentialWeekly;
  const totalDaily = Math.round(totalWeekly / 7);

  return {
    billsWeekly: billsBurn.weekly,
    billsDaily: billsBurn.daily,
    essentialWeekly,
    essentialDaily,
    totalWeekly,
    totalDaily,
  };
}

// ─── Runway Engine ────────────────────────────────────────────────────────────

export type RunwayHealth = "HEALTHY" | "MODERATE" | "CRITICAL";

export interface RunwayInput {
  /** Sum of all accessible liquid cash / savings / remaining safe-to-spend. */
  liquidPoolMinor: Money;
  /** Total baseline weekly burn in minor units. */
  weeklyBurn: Money;
}

export interface RunwayResult {
  liquidPool: Money;
  weeklyBurn: Money;
  dailyBurn: Money;
  /** Weeks of survival/flexibility. */
  weeks: number;
  /** Days of survival/flexibility. */
  days: number;
  /** Formatted human-readable runway string (e.g. "14.2 weeks", "4.5 days"). */
  formatted: string;
  isIndefinite: boolean;
  health: RunwayHealth;
}

/**
 * Calculates real-time financial Runway (in units of weeks and days) from
 * the user's accessible liquid pool and baseline burn rate.
 */
export function calculateRunway(input: RunwayInput): RunwayResult {
  const liquidPool = Number.isFinite(input.liquidPoolMinor) ? Math.max(0, input.liquidPoolMinor) : 0;
  const weeklyBurn = Number.isFinite(input.weeklyBurn) ? Math.max(0, input.weeklyBurn) : 0;
  const dailyBurn = Math.round(weeklyBurn / 7);

  if (weeklyBurn <= 0) {
    return {
      liquidPool,
      weeklyBurn: 0,
      dailyBurn: 0,
      weeks: Infinity,
      days: Infinity,
      formatted: "∞ weeks",
      isIndefinite: true,
      health: "HEALTHY",
    };
  }

  const rawWeeks = liquidPool / weeklyBurn;
  const weeks = Number(rawWeeks.toFixed(1));
  const days = Number((rawWeeks * 7).toFixed(1));

  let health: RunwayHealth = "HEALTHY";
  if (weeks < 4) {
    health = "CRITICAL";
  } else if (weeks < 12) {
    health = "MODERATE";
  }

  const formatted =
    weeks >= 1 ? `${weeks.toFixed(1)} wks` : `${days.toFixed(1)} days`;

  return {
    liquidPool,
    weeklyBurn,
    dailyBurn,
    weeks,
    days,
    formatted,
    isIndefinite: false,
    health,
  };
}

// ─── Time Impact Engine ───────────────────────────────────────────────────────

export type TimeImpactVariant =
  | "inflow"
  | "essential"
  | "discretionary_burn"
  | "neutral";

export interface TimeImpactOptions {
  isEssential?: boolean;
}

export interface TimeImpactResult {
  /** Time impact in days (signed: + for inflow, - for outflow). */
  days: number;
  /** Time impact in weeks (signed). */
  weeks: number;
  /** Human readable time consequence string (e.g. "+2.4 wks", "-1.5 days"). */
  formatted: string;
  /** Badge color styling variant. */
  badgeVariant: TimeImpactVariant;
}

/**
 * Computes the time consequence of a transaction relative to the daily baseline burn.
 *
 * Examples:
 * - ₱5,000 inflow with ₱500/day burn -> +10.0 days -> "+1.4 wks" (inflow)
 * - ₱750 dinner with ₱500/day burn -> -1.5 days -> "-1.5 days" (neutral)
 * - ₱1,500 discretionary shopping with ₱500/day burn -> -3.0 days -> "-3.0 days" (discretionary_burn)
 * - ₱1,200 essential groceries -> "-2.4 days" (essential)
 */
export function calculateTimeImpact(
  amountMinor: Money,
  dailyBurnRate: Money,
  options?: TimeImpactOptions,
): TimeImpactResult {
  if (dailyBurnRate <= 0 || !Number.isFinite(dailyBurnRate) || !Number.isFinite(amountMinor)) {
    return {
      days: 0,
      weeks: 0,
      formatted: "0 days",
      badgeVariant: amountMinor >= 0 ? "inflow" : "neutral",
    };
  }

  // Days consumed or added
  const days = amountMinor / dailyBurnRate;
  const weeks = days / 7;
  const absDays = Math.abs(days);
  const absWeeks = Math.abs(weeks);
  const sign = amountMinor >= 0 ? "+" : "−";

  let formatted: string;
  if (absDays < 7) {
    formatted = `${sign}${absDays.toFixed(1)} day${absDays.toFixed(1) === "1.0" ? "" : "s"}`;
  } else {
    formatted = `${sign}${absWeeks.toFixed(1)} wks`;
  }

  let badgeVariant: TimeImpactVariant = "neutral";
  if (amountMinor >= 0) {
    badgeVariant = "inflow";
  } else if (options?.isEssential) {
    badgeVariant = "essential";
  } else if (absDays > 2) {
    badgeVariant = "discretionary_burn";
  }

  return {
    days: Number(days.toFixed(1)),
    weeks: Number(weeks.toFixed(1)),
    formatted,
    badgeVariant,
  };
}

