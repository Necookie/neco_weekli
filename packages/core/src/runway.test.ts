import assert from "node:assert/strict";
import { test } from "node:test";
import { toMinor } from "./money.ts";
import {
  annualizeAmount,
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
