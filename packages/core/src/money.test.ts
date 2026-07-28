import assert from "node:assert/strict";
import { test } from "node:test";
import { allocate, clampMin, formatMoney, toMinor, toMajor } from "./money.ts";

test("toMinor / toMajor round-trip without float drift", () => {
  assert.equal(toMinor(15000), 1_500_000);
  assert.equal(toMinor(549), 54_900);
  assert.equal(toMinor(0.1 + 0.2), 30); // would be 0.30000000000000004 as float
  assert.equal(toMajor(54_900), 549);
});

test("clampMin floors at zero", () => {
  assert.equal(clampMin(-5), 0);
  assert.equal(clampMin(10), 10);
  assert.equal(clampMin(-5, -10), -5);
});

test("allocate never loses or invents a minor unit", () => {
  const parts = allocate(100, [1, 1, 1]); // ₱1.00 across three
  assert.equal(parts.reduce((a, b) => a + b, 0), 100);
  assert.deepEqual([...parts].sort(), [33, 33, 34]);

  const zero = allocate(1000, [0, 0, 0]);
  assert.deepEqual(zero, [0, 0, 0]);
});

test("formatMoney renders currency from minor units", () => {
  assert.match(formatMoney(54_900, "PHP", "en-PH"), /549/);
});
