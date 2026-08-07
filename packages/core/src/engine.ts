/**
 * The Weekli math engine (SRS §2). Pure functions, no I/O.
 *
 * Design decisions that fix the v1 spec:
 *  - Bills accrue against their ACTUAL due date, not a flat `/4.33` divisor, so
 *    4- vs 5-payday months never mistime a bill.
 *  - The daily cap can never divide by zero (day 7) and never goes negative.
 */

import type { Weekday } from "./dates.ts";
import {
  addDays,
  diffDays,
  nextDueDate,
  paydaysBetween,
} from "./dates.ts";
import type { Money } from "./money.ts";
import { clampMin } from "./money.ts";

export interface Bill {
  id: string;
  title: string;
  /** Monthly cost in minor units. */
  monthlyAmount: Money;
  /** Day of month the bill is due (1–31; clamps to month length). */
  dueDayOfMonth: number;
}

export interface BillAccrual {
  billId: string;
  /** How much is already set aside toward this bill's current cycle. */
  accrued: Money;
}

/** Average weeks per month. Kept ONLY for a rough display estimate. */
export const MONTHLY_WEEKS = 4.33;

/**
 * Flat "typical weekly bills" figure for display. NOT used to drive the
 * reserve — {@link requiredThisPayday} does that, due-date aware.
 */
export function weeklyBillEstimate(bills: Bill[]): Money {
  const monthly = bills.reduce((s, b) => s + b.monthlyAmount, 0);
  return Math.round(monthly / MONTHLY_WEEKS);
}

export interface AccrualContext {
  today: Date;
  payday: Weekday;
  accrued?: Money;
}

/**
 * Amount to lock into Bills Reserve for one bill on THIS payday, so the bill is
 * fully funded by its due date. Spreads the outstanding amount evenly across
 * the paydays remaining before (and including) the due date.
 */
export function requiredThisPayday(bill: Bill, ctx: AccrualContext): Money {
  const accrued = ctx.accrued ?? 0;
  const remaining = clampMin(bill.monthlyAmount - accrued);
  if (remaining === 0) return 0;

  const due = nextDueDate(bill.dueDayOfMonth, ctx.today);
  // Paydays in [today, due] — end is exclusive so add a day to include `due`.
  const paydays = Math.max(
    1,
    paydaysBetween(ctx.today, addDays(due, 1), ctx.payday),
  );
  return Math.ceil(remaining / paydays);
}

export interface ReserveContext {
  today: Date;
  payday: Weekday;
}

/** Total to lock into Bills Reserve on this payday across all active bills. */
export function weeklyReserve(
  bills: Bill[],
  accruals: BillAccrual[],
  ctx: ReserveContext,
): Money {
  const map = new Map(accruals.map((a) => [a.billId, a.accrued]));
  return bills.reduce(
    (s, b) =>
      s +
      requiredThisPayday(b, {
        today: ctx.today,
        payday: ctx.payday,
        accrued: map.get(b.id) ?? 0,
      }),
    0,
  );
}

export interface SplitInput {
  income: Money;
  bills: Bill[];
  accruals: BillAccrual[];
  /** 0..1 */
  savingsPct: number;
  today: Date;
  payday: Weekday;
}

export interface Split {
  billsReserve: Money;
  savings: Money;
  safeToSpend: Money;
  /** True when income cannot cover bills + savings this payday. */
  shortfall: boolean;
}

/** Divide an incoming payday amount into the three vaults (FR-3).
 *
 * Vault-sum invariant: `billsReserve + savings + safeToSpend === income`
 * always holds. Priority order on shortfall: bills > savings > spend.
 * The `shortfall` flag indicates income was insufficient to fully fund all
 * three vaults at their requested amounts.
 */
export function computeSplit(input: SplitInput): Split {
  const rawBillsReserve = weeklyReserve(input.bills, input.accruals, {
    today: input.today,
    payday: input.payday,
  });
  const shortfall = rawBillsReserve + Math.round(input.income * input.savingsPct) > input.income;
  // Bills have highest priority — but the reported vault value is capped at income.
  const billsReserve = Math.min(rawBillsReserve, input.income);
  const rawSavings = Math.round(input.income * input.savingsPct);
  // Savings absorbs any remaining deficit after bills.
  const savings = clampMin(Math.min(rawSavings, input.income - billsReserve));
  const rawSpend = input.income - billsReserve - savings;

  return {
    billsReserve,
    savings,
    safeToSpend: clampMin(rawSpend),
    shortfall,
  };
}

export interface DailyCapInput {
  weeklySafeToSpend: Money;
  spentThisWeek: Money;
  today: Date;
  /** Last day of the current spending week (inclusive). */
  weekEnd: Date;
}

export interface DailyCap {
  cap: Money;
  remaining: Money;
  overspent: boolean;
  daysLeft: number;
}

/** Dynamic daily Safe-to-Spend cap (FR-4). Never divides by zero, never < 0. */
export function dailySafeCap(input: DailyCapInput): DailyCap {
  const remaining = input.weeklySafeToSpend - input.spentThisWeek;
  // include today -> minimum 1, so the final day of the week is safe.
  const daysLeft = Math.max(1, diffDays(input.weekEnd, input.today) + 1);
  return {
    cap: clampMin(Math.floor(remaining / daysLeft)),
    remaining,
    overspent: remaining < 0,
    daysLeft,
  };
}

export interface DangerDay {
  billId: string;
  title: string;
  dueDate: Date;
  projected: Money;
  shortfall: Money;
}

/**
 * Bills that will NOT be fully funded by their due date at the current accrual
 * pace (FR-9). Empty array means every bill is on track.
 */
export function dangerDays(
  bills: Bill[],
  accruals: BillAccrual[],
  ctx: ReserveContext,
): DangerDay[] {
  const map = new Map(accruals.map((a) => [a.billId, a.accrued]));
  const out: DangerDay[] = [];

  for (const b of bills) {
    const accrued = map.get(b.id) ?? 0;
    const due = nextDueDate(b.dueDayOfMonth, ctx.today);
    const perPayday = requiredThisPayday(b, {
      today: ctx.today,
      payday: ctx.payday,
      accrued,
    });
    const paydays = paydaysBetween(ctx.today, addDays(due, 1), ctx.payday);
    const projected = Math.min(
      b.monthlyAmount,
      accrued + perPayday * paydays,
    );
    if (projected < b.monthlyAmount) {
      out.push({
        billId: b.id,
        title: b.title,
        dueDate: due,
        projected,
        shortfall: b.monthlyAmount - projected,
      });
    }
  }
  return out;
}
