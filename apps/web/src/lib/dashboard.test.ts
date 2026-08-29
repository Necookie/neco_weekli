import assert from "node:assert/strict";
import { test } from "node:test";
import { toMinor } from "@neco/core";
import { computeDashboard } from "./dashboard.ts";
import type { AppState } from "./types.ts";

const NOW = new Date("2026-08-25T09:00:00Z"); // a Tuesday

function baseState(overrides: Partial<AppState> = {}): AppState {
  return {
    settings: {
      income: toMinor(5000),
      savingsPct: 0.2,
      essentialWeeklyBaselineMinor: toMinor(500),
      payday: "MONDAY",
      weekStart: "MONDAY",
      currency: "PHP",
      billReminders: true,
      rolloverEnabled: true,
      hasCompletedOnboarding: true,
    },
    bills: [],
    accruals: [],
    expenses: [],
    savings: {
      balanceMinor: toMinor(1000),
      goalMinor: toMinor(10000),
      label: "Emergency fund",
      isLiquid: true,
    },
    contributions: [],
    targetSliders: {
      commuteMajor: 100,
      campusMealsMajor: 200,
      datesMajor: 50,
      snacksMajor: 50,
    },
    ...overrides,
  };
}

test("computeDashboard: vault-sum invariant holds for the split", () => {
  const d = computeDashboard(baseState(), NOW);
  assert.equal(
    d.split.billsReserve + d.split.savings + d.split.safeToSpend,
    d.income,
  );
});

test("computeDashboard: spentThisWeek sums only this week's expenses", () => {
  const state = baseState({
    expenses: [
      { id: "e1", title: "Lunch", category: "Food & Dining", amountMajor: 100, dayIndex: 0 },
      { id: "e2", title: "Snack", category: "Food & Dining", amountMajor: 50, dayIndex: 1 },
    ],
  });
  const d = computeDashboard(state, NOW);
  assert.equal(d.spentThisWeek, toMinor(150));
});

test("computeDashboard: essential-category expenses count toward baseline burn even without an explicit flag", () => {
  const state = baseState({
    settings: { ...baseState().settings, essentialWeeklyBaselineMinor: 0 },
    expenses: [
      { id: "e1", title: "Groceries", category: "Groceries", amountMajor: 200, dayIndex: 0 },
    ],
  });
  const d = computeDashboard(state, NOW);
  assert.equal(d.baselineBurn.essentialWeekly, toMinor(200));
});

test("computeDashboard: explicit isEssential overrides the category default", () => {
  const state = baseState({
    settings: { ...baseState().settings, essentialWeeklyBaselineMinor: 0 },
    expenses: [
      // Shopping isn't in ESSENTIAL_CATEGORIES, but the explicit flag wins.
      { id: "e1", title: "Meds from a general store", category: "Shopping", amountMajor: 300, dayIndex: 0, isEssential: true },
    ],
  });
  const d = computeDashboard(state, NOW);
  assert.equal(d.baselineBurn.essentialWeekly, toMinor(300));
  assert.equal(d.activity[0]?.isEssential, true);
});

test("computeDashboard: the essential baseline floor wins when tracked essential spend is lower", () => {
  const state = baseState({
    settings: { ...baseState().settings, essentialWeeklyBaselineMinor: toMinor(500) },
    expenses: [
      { id: "e1", title: "Groceries", category: "Groceries", amountMajor: 200, dayIndex: 0 },
    ],
  });
  const d = computeDashboard(state, NOW);
  assert.equal(d.baselineBurn.essentialWeekly, toMinor(500));
});

test("computeDashboard: activity time-impact sign matches inflow vs outflow", () => {
  const state = baseState({
    expenses: [
      { id: "e1", title: "Dinner", category: "Food & Dining", amountMajor: 100, dayIndex: 0 },
    ],
    contributions: [{ id: "c1", label: "Top-up", when: "Today", amountMinor: toMinor(200) }],
  });
  const d = computeDashboard(state, NOW);
  assert.ok(d.activity[0]!.timeImpact.days < 0, "an expense should reduce runway");
  assert.ok(d.contributions[0]!.timeImpact.days > 0, "a contribution should extend runway");
});

test("computeDashboard: danger day is flagged when a bill can't be funded before its due date", () => {
  const state = baseState({
    settings: { ...baseState().settings, income: toMinor(10) }, // barely any income
    bills: [
      { id: "b1", title: "Rent", monthlyAmount: toMinor(5000), frequency: "MONTHLY", dueDayOfMonth: 26 }, // due tomorrow
    ],
    accruals: [{ billId: "b1", accrued: 0 }],
  });
  const d = computeDashboard(state, NOW);
  assert.equal(d.danger.length, 1);
  assert.equal(d.danger[0]!.billId, "b1");
});

test("computeDashboard: savings pct-done is clamped to a sane 0..N range and 0 goal never divides by zero", () => {
  const state = baseState({
    savings: { balanceMinor: toMinor(500), goalMinor: 0, label: "No goal set", isLiquid: true },
  });
  const d = computeDashboard(state, NOW);
  assert.equal(d.savings.pct, 0);
});

test("computeDashboard: slider simulation surplus is safe-to-spend minus the targeted allocations", () => {
  const state = baseState();
  const d = computeDashboard(state, NOW);
  const targetedMinor = toMinor(100 + 200 + 50 + 50);
  assert.equal(
    d.sliderSimulation.surplusMinor,
    d.split.safeToSpend - targetedMinor,
  );
});

test("computeDashboard: respects custom weekStart and rotates day labels accurately", () => {
  const state = baseState({
    settings: { ...baseState().settings, weekStart: "SUNDAY" },
    expenses: [
      { id: "e1", title: "Sunday Brunch", category: "Food & Dining", amountMajor: 150, dayIndex: 0 },
      { id: "e2", title: "Tuesday Tacos", category: "Food & Dining", amountMajor: 100, dayIndex: 2 },
    ],
  });
  const d = computeDashboard(state, NOW); // NOW is Tuesday
  assert.equal(d.weekSpend.perDay[0]!.label, "Sun");
  assert.equal(d.weekSpend.perDay[1]!.label, "Mon");
  assert.equal(d.weekSpend.perDay[2]!.label, "Tue");
  // Tuesday is index 2 when week starts Sunday
  assert.equal(d.weekSpend.perDay[2]!.isToday, true);
  assert.equal(d.weekSpend.perDay[0]!.minor, toMinor(150));
  assert.equal(d.weekSpend.perDay[2]!.minor, toMinor(100));
  assert.equal(d.activity[0]!.dayLabel, "Tue");
  assert.equal(d.activity[0]!.dayFullLabel, "Tuesday");
});

test("computeDashboard: formats different currency codes cleanly", () => {
  const state = baseState({
    settings: { ...baseState().settings, currency: "USD" },
  });
  const d = computeDashboard(state, NOW);
  assert.match(d.fmt(toMinor(100)), /\$100/);
});
