import assert from "node:assert/strict";
import { test } from "node:test";
import { toMinor } from "./money.ts";
import {
  annualizeAmount,
  calculateBaselineBurn,
  calculateNormalizedBillsBurn,
  calculateRunway,
  calculateTimeImpact,
  normalizeToDaily,
  normalizeToWeekly,
} from "./runway.ts";

test("normalizeToWeekly accurately normalizes all frequencies", () => {
  // Weekly: unchanged
  assert.equal(normalizeToWeekly(toMinor(500), "WEEKLY"), toMinor(500));

  // Bi-weekly: amount / 2
  assert.equal(normalizeToWeekly(toMinor(1000), "BIWEEKLY"), toMinor(500));

  // Monthly: (amount * 12) / 52 -> e.g. ₱700 gym -> (70000 * 12) / 52 = 16153.84... -> 16154 minor units (₱161.54)
  assert.equal(normalizeToWeekly(toMinor(700), "MONTHLY"), 16154);

  // Quarterly: (amount * 4) / 52 -> e.g. ₱2600 quarterly -> ₱200/wk
  assert.equal(normalizeToWeekly(toMinor(2600), "QUARTERLY"), toMinor(200));

  // Annually: amount / 52 -> e.g. ₱5200 annual sub -> ₱100/wk
  assert.equal(normalizeToWeekly(toMinor(5200), "ANNUALLY"), toMinor(100));
});

test("normalizeToDaily derives exact daily burn from weekly rate", () => {
  // Weekly ₱700 -> ₱100/day
  assert.equal(normalizeToDaily(toMinor(700), "WEEKLY"), toMinor(100));

  // Monthly ₱700 -> weekly 16154 minor units -> 16154 / 7 = 2307.7... -> 2308 minor units (₱23.08/day)
  assert.equal(normalizeToDaily(toMinor(700), "MONTHLY"), 2308);
});

test("annualizeAmount calculates correct 12-month equivalent", () => {
  assert.equal(annualizeAmount(toMinor(100), "WEEKLY"), toMinor(5200));
  assert.equal(annualizeAmount(toMinor(200), "BIWEEKLY"), toMinor(5200));
  assert.equal(annualizeAmount(toMinor(500), "MONTHLY"), toMinor(6000));
  assert.equal(annualizeAmount(toMinor(1500), "QUARTERLY"), toMinor(6000));
  assert.equal(annualizeAmount(toMinor(10000), "ANNUALLY"), toMinor(10000));
});

test("calculateNormalizedBillsBurn aggregates multiple cadences", () => {
  const bills = [
    { monthlyAmount: toMinor(520), frequency: "WEEKLY" as const }, // ₱520/wk
    { monthlyAmount: toMinor(700), frequency: "MONTHLY" as const }, // ₱161.54/wk -> 16154 minor
    { monthlyAmount: toMinor(5200), frequency: "ANNUALLY" as const }, // ₱100/wk -> 10000 minor
  ];
  const burn = calculateNormalizedBillsBurn(bills);
  // 52000 + 16154 + 10000 = 78154 minor units (₱781.54/wk)
  assert.equal(burn.weekly, 78154);
  assert.equal(burn.daily, Math.round(78154 / 7));
});

test("calculateBaselineBurn uses maximum of tracked vs floor essential spend", () => {
  const bills = [{ monthlyAmount: toMinor(1200), frequency: "MONTHLY" as const }]; // ₱276.92/wk -> 27692 minor
  
  // Case 1: Tracked essential (₱1,000) > Floor (₱500)
  const burn1 = calculateBaselineBurn({
    bills,
    essentialExpenseWeekly: toMinor(1000),
    baselineFloorWeekly: toMinor(500),
  });
  assert.equal(burn1.essentialWeekly, toMinor(1000));
  assert.equal(burn1.totalWeekly, 27692 + toMinor(1000));

  // Case 2: Floor (₱1,500) > Tracked essential (₱400)
  const burn2 = calculateBaselineBurn({
    bills,
    essentialExpenseWeekly: toMinor(400),
    baselineFloorWeekly: toMinor(1500),
  });
  assert.equal(burn2.essentialWeekly, toMinor(1500));
  assert.equal(burn2.totalWeekly, 27692 + toMinor(1500));
});

test("calculateRunway calculates accurate weeks and days with zero-safety", () => {
  // ₱50,000 liquid pool with ₱2,500/week burn -> 20.0 weeks (140.0 days)
  const r1 = calculateRunway({
    liquidPoolMinor: toMinor(50000),
    weeklyBurn: toMinor(2500),
  });
  assert.equal(r1.weeks, 20.0);
  assert.equal(r1.days, 140.0);
  assert.equal(r1.formatted, "20.0 wks");
  assert.equal(r1.health, "HEALTHY");

  // Moderate health (between 4 and 12 weeks)
  const r2 = calculateRunway({
    liquidPoolMinor: toMinor(15000),
    weeklyBurn: toMinor(2500),
  });
  assert.equal(r2.weeks, 6.0);
  assert.equal(r2.health, "MODERATE");

  // Critical health (< 4 weeks)
  const r3 = calculateRunway({
    liquidPoolMinor: toMinor(5000),
    weeklyBurn: toMinor(2500),
  });
  assert.equal(r3.weeks, 2.0);
  assert.equal(r3.health, "CRITICAL");

  // Sub-week formatting (e.g. 0.5 weeks -> 3.5 days)
  const r4 = calculateRunway({
    liquidPoolMinor: toMinor(1000),
    weeklyBurn: toMinor(2000),
  });
  assert.equal(r4.weeks, 0.5);
  assert.equal(r4.days, 3.5);
  assert.equal(r4.formatted, "3.5 days");

  // Zero weekly burn safe handling
  const rZero = calculateRunway({
    liquidPoolMinor: toMinor(10000),
    weeklyBurn: 0,
  });
  assert.equal(rZero.isIndefinite, true);
  assert.equal(rZero.formatted, "∞ weeks");
});

test("calculateTimeImpact computes magnitude-aware tag formatting and badge variants", () => {
  const dailyBurn = toMinor(500); // ₱500/day

  // Inflow > 7 days -> weeks formatting
  const inflow = calculateTimeImpact(toMinor(7000), dailyBurn);
  assert.equal(inflow.days, 14.0);
  assert.equal(inflow.weeks, 2.0);
  assert.equal(inflow.formatted, "+2.0 wks");
  assert.equal(inflow.badgeVariant, "inflow");

  // Essential outflow < 7 days
  const essential = calculateTimeImpact(-toMinor(750), dailyBurn, { isEssential: true });
  assert.equal(essential.days, -1.5);
  assert.equal(essential.formatted, "−1.5 days");
  assert.equal(essential.badgeVariant, "essential");

  // Discretionary heavy burn (> 2 days)
  const heavyBurn = calculateTimeImpact(-toMinor(1500), dailyBurn, { isEssential: false });
  assert.equal(heavyBurn.days, -3.0);
  assert.equal(heavyBurn.formatted, "−3.0 days");
  assert.equal(heavyBurn.badgeVariant, "discretionary_burn");

  // Minor discretionary burn (<= 2 days)
  const minorBurn = calculateTimeImpact(-toMinor(500), dailyBurn, { isEssential: false });
  assert.equal(minorBurn.days, -1.0);
  assert.equal(minorBurn.formatted, "−1.0 day");
  assert.equal(minorBurn.badgeVariant, "neutral");

  // Zero or negative daily burn rate guard
  const zeroBurnImpact = calculateTimeImpact(toMinor(500), 0);
  assert.equal(zeroBurnImpact.days, 0);
  assert.equal(zeroBurnImpact.formatted, "0 days");

  const zeroBurnOutflow = calculateTimeImpact(-toMinor(500), 0);
  assert.equal(zeroBurnOutflow.days, 0);
  assert.equal(zeroBurnOutflow.badgeVariant, "neutral");
});

test("calculateRunway handles 0 pool and negative/NaN inputs safely", () => {
  const zeroBoth = calculateRunway({
    liquidPoolMinor: 0,
    weeklyBurn: 0,
  });
  assert.equal(zeroBoth.weeks, Infinity);
  assert.equal(zeroBoth.isIndefinite, true);

  const nanInput = calculateRunway({
    liquidPoolMinor: NaN,
    weeklyBurn: NaN,
  });
  assert.equal(nanInput.weeks, Infinity);
  assert.equal(nanInput.isIndefinite, true);
});

