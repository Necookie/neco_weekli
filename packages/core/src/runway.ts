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
