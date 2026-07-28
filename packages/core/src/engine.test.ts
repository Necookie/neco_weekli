import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, getWeekday } from "./dates.ts";
import {
  type Bill,
  computeSplit,
  dailySafeCap,
  dangerDays,
  requiredThisPayday,
  weeklyBillEstimate,
} from "./engine.ts";
import { toMinor } from "./money.ts";

const d = (iso: string) => new Date(iso + "T00:00:00Z");

const netflix: Bill = {
  id: "netflix",
  title: "Netflix",
  monthlyAmount: toMinor(549),
  dueDayOfMonth: 15,
};

test("weeklyBillEstimate is the flat /4.33 display figure", () => {
  const est = weeklyBillEstimate([netflix]);
  assert.equal(est, Math.round(toMinor(549) / 4.33));
});

test("requiredThisPayday fully funds a bill by its due date (the v1 fix)", () => {
  // Simulate every Monday from today until the due date, accruing each payday.
  let accrued = 0;
  let cursor = d("2026-07-27"); // a Monday
  const due = d("2026-08-15");
  const payday = "MONDAY" as const;

  for (let i = 0; i < 60 && cursor <= due; i++) {
    if (getWeekday(cursor) === payday) {
      accrued += requiredThisPayday(netflix, { today: cursor, payday, accrued });
    }
    cursor = addDays(cursor, 1);
  }

  // Fully covered, and not wildly over-reserved.
  assert.ok(accrued >= netflix.monthlyAmount, `accrued ${accrued}`);
  assert.ok(accrued <= netflix.monthlyAmount + 100, `over-reserved ${accrued}`);
});

test("computeSplit divides income across three vaults", () => {
  const split = computeSplit({
    income: toMinor(15000),
    bills: [netflix],
    accruals: [],
    savingsPct: 0.2,
    today: d("2026-07-27"),
    payday: "MONDAY",
  });

  assert.equal(split.savings, toMinor(3000)); // 20% of 15000
  assert.ok(split.billsReserve > 0);
  assert.equal(
    split.billsReserve + split.savings + split.safeToSpend,
    toMinor(15000),
  );
  assert.equal(split.shortfall, false);
});

test("computeSplit flags a shortfall and floors Safe-to-Spend at 0", () => {
  const split = computeSplit({
    income: toMinor(500),
    bills: [{ ...netflix, monthlyAmount: toMinor(2000) }],
    accruals: [],
    savingsPct: 0.2,
    today: d("2026-07-27"),
    payday: "MONDAY",
  });
  assert.equal(split.shortfall, true);
  assert.equal(split.safeToSpend, 0);
});

test("dailySafeCap: no divide-by-zero on the last day of the week", () => {
  const cap = dailySafeCap({
    weeklySafeToSpend: toMinor(700),
    spentThisWeek: toMinor(100),
    today: d("2026-08-02"), // Sunday, the week end
    weekEnd: d("2026-08-02"),
  });
  assert.equal(cap.daysLeft, 1);
  assert.equal(cap.cap, toMinor(600)); // remaining, all spendable today
  assert.equal(cap.overspent, false);
});

test("dailySafeCap: overspend -> cap 0, flagged, never negative", () => {
  const cap = dailySafeCap({
    weeklySafeToSpend: toMinor(700),
    spentThisWeek: toMinor(900),
    today: d("2026-07-29"),
    weekEnd: d("2026-08-02"),
  });
  assert.equal(cap.overspent, true);
  assert.equal(cap.cap, 0);
  assert.ok(cap.remaining < 0);
});

test("dangerDays flags a bill due before any payday can fund it", () => {
  // Bill due tomorrow, nothing accrued, next payday is days away.
  const urgent: Bill = {
    id: "rent",
    title: "Rent",
    monthlyAmount: toMinor(8000),
    dueDayOfMonth: 29,
  };
  const danger = dangerDays([urgent], [], {
    today: d("2026-07-28"), // Tue; due 07-29, next Monday is 08-03
    payday: "MONDAY",
  });
  assert.equal(danger.length, 1);
  assert.equal(danger[0]!.billId, "rent");
  assert.ok(danger[0]!.shortfall > 0);
});

test("dangerDays is empty when bills are on track", () => {
  const danger = dangerDays([netflix], [], {
    today: d("2026-07-27"),
    payday: "MONDAY",
  });
  assert.deepEqual(danger, []);
});
