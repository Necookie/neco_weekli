import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDays,
  diffDays,
  getWeekday,
  nextDueDate,
  paydaysBetween,
  weekRange,
} from "./dates.ts";

const d = (iso: string) => new Date(iso + "T00:00:00Z");

test("getWeekday is UTC-stable", () => {
  assert.equal(getWeekday(d("2026-07-27")), "MONDAY");
  assert.equal(getWeekday(d("2026-07-28")), "TUESDAY");
});

test("paydaysBetween counts inclusively from the start", () => {
  // Mondays in [2026-07-27, 2026-08-24): 07-27, 08-03, 08-10, 08-17 = 4
  assert.equal(
    paydaysBetween(d("2026-07-27"), d("2026-08-24"), "MONDAY"),
    4,
  );
  // start day is itself a payday and counts
  assert.equal(paydaysBetween(d("2026-07-27"), d("2026-07-28"), "MONDAY"), 1);
  // empty / reversed interval
  assert.equal(paydaysBetween(d("2026-07-28"), d("2026-07-28"), "MONDAY"), 0);
});

test("nextDueDate clamps overflowing due days to month end", () => {
  // due day 31 in February -> 28 (2026 is not a leap year)
  assert.equal(
    nextDueDate(31, d("2026-02-01")).toISOString().slice(0, 10),
    "2026-02-28",
  );
  // on/after semantics
  assert.equal(
    nextDueDate(15, d("2026-07-28")).toISOString().slice(0, 10),
    "2026-08-15",
  );
  assert.equal(
    nextDueDate(28, d("2026-07-28")).toISOString().slice(0, 10),
    "2026-07-28",
  );
});

test("addDays / diffDays are inverse", () => {
  assert.equal(diffDays(addDays(d("2026-07-28"), 10), d("2026-07-28")), 10);
});

test("weekRange spans exactly 7 days and includes today", () => {
  // 2026-07-28 is a Tuesday.
  const { start, end } = weekRange(d("2026-07-28"), "MONDAY");
  assert.equal(start.toISOString().slice(0, 10), "2026-07-27");
  assert.equal(end.toISOString().slice(0, 10), "2026-08-02");
  assert.equal(diffDays(end, start), 6);
});

test("weekRange when today IS the configured week-start day", () => {
  const { start, end } = weekRange(d("2026-07-27"), "MONDAY");
  assert.equal(start.toISOString().slice(0, 10), "2026-07-27");
  assert.equal(end.toISOString().slice(0, 10), "2026-08-02");
});

test("weekRange when today is the last day of the configured week", () => {
  // Sunday, with weeks starting Monday -> today is the week's last day.
  const { start, end } = weekRange(d("2026-08-02"), "MONDAY");
  assert.equal(start.toISOString().slice(0, 10), "2026-07-27");
  assert.equal(end.toISOString().slice(0, 10), "2026-08-02");
});

test("weekRange respects a non-Monday week start", () => {
  // Weeks starting Sunday; 2026-07-28 (Tue) falls in the week of 2026-07-26.
  const { start, end } = weekRange(d("2026-07-28"), "SUNDAY");
  assert.equal(start.toISOString().slice(0, 10), "2026-07-26");
  assert.equal(end.toISOString().slice(0, 10), "2026-08-01");
});
