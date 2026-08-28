/**
 * Shared constants for the @neco/core package.
 *
 * Centralising weekday data here avoids the same arrays being re-declared in
 * every file that needs to iterate or label weekdays.
 */

import type { Weekday } from "./dates.ts";

/**
 * All seven weekdays in JavaScript's `Date.getUTCDay()` order (Sun = 0).
 * Used for index-based lookups that must align with the JS Date API.
 */
export const WEEKDAY_ORDER_SUN_FIRST: Weekday[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

/**
 * All seven weekdays in Mon–Sun order.
 * Used for the spending-week bar chart and payday math that treats Monday as
 * day 0 of the work week.
 */
export const WEEKDAY_ORDER: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

/** Short 3-letter labels aligned with {@link WEEKDAY_ORDER} (Mon–Sun). */
export const DAY_LABEL_SHORT: string[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

/** Full day-name labels aligned with {@link WEEKDAY_ORDER} (Mon–Sun). */
export const DAY_LABEL_FULL: string[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Human-readable label map for use in `<select>` options and display text. */
export const WEEKDAY_LABEL: Record<Weekday, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export const WEEKDAY_LABEL_SHORT: Record<Weekday, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

/**
 * Returns all 7 weekdays rotated to start on the user-configured `weekStart`.
 */
export function getWeekdaysForStart(weekStart: Weekday = "MONDAY"): Weekday[] {
  const startIdx = WEEKDAY_ORDER.indexOf(weekStart);
  if (startIdx <= 0) return [...WEEKDAY_ORDER];
  return [...WEEKDAY_ORDER.slice(startIdx), ...WEEKDAY_ORDER.slice(0, startIdx)];
}

/**
 * Returns short 3-letter day labels rotated to match `weekStart`.
 */
export function getShortDayLabelsForStart(weekStart: Weekday = "MONDAY"): string[] {
  return getWeekdaysForStart(weekStart).map((w) => WEEKDAY_LABEL_SHORT[w]);
}

/**
 * Returns full day labels rotated to match `weekStart`.
 */
export function getFullDayLabelsForStart(weekStart: Weekday = "MONDAY"): string[] {
  return getWeekdaysForStart(weekStart).map((w) => WEEKDAY_LABEL[w]);
}
