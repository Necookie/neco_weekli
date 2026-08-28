/**
 * Calendar-date helpers. Everything operates on UTC midnight so results are
 * timezone-stable and deterministic across devices — critical for money math.
 */

export type Weekday =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

const WEEKDAYS: Weekday[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export const weekdayIndex = (w: Weekday): number => WEEKDAYS.indexOf(w);

/** Normalise any Date/ISO string to UTC midnight of that calendar day. */
export function dateOnly(d: Date | string): Date {
  const t = typeof d === "string" ? new Date(d) : d;
  return new Date(
    Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()),
  );
}

export function addDays(d: Date, n: number): Date {
  const x = dateOnly(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/** Whole days from `b` to `a` (a - b). */
export function diffDays(a: Date, b: Date): number {
  return Math.round(
    (dateOnly(a).getTime() - dateOnly(b).getTime()) / 86_400_000,
  );
}

export function getWeekday(d: Date): Weekday {
  return WEEKDAYS[dateOnly(d).getUTCDay()]!;
}

/**
 * The Mon–Sun-ordered index of `d` within a week that starts on `weekStart`.
 * E.g. with `weekStart = "MONDAY"`, Monday -> 0 … Sunday -> 6.
 */
export function weekdayIndexFrom(d: Date, weekStart: Weekday): number {
  return (weekdayIndex(getWeekday(d)) - weekdayIndex(weekStart) + 7) % 7;
}

/**
 * The inclusive [start, end] bounds of the spending week containing `today`,
 * given the user-configured `weekStart` weekday.
 */
export function weekRange(
  today: Date,
  weekStart: Weekday,
): { start: Date; end: Date } {
  const offset = weekdayIndexFrom(today, weekStart);
  const start = addDays(today, -offset);
  const end = addDays(start, 6);
  return { start, end };
}

/**
 * Count scheduled paydays landing on `payday` inside the half-open interval
 * [from, to). The `from` day counts if it is itself a payday.
 */
export function paydaysBetween(from: Date, to: Date, payday: Weekday): number {
  const start = dateOnly(from);
  const end = dateOnly(to);
  if (end <= start) return 0;

  const target = weekdayIndex(payday);
  const delta = (target - start.getUTCDay() + 7) % 7;
  const first = addDays(start, delta); // first payday on/after `from`
  if (first >= end) return 0;

  const span = diffDays(end, first); // > 0
  return Math.ceil(span / 7);
}

/**
 * Next occurrence (on/after `from`) of a monthly due day. A due day beyond the
 * month length clamps to the last day (e.g. 31 -> Feb 28/29).
 */
export function nextDueDate(dueDay: number, from: Date): Date {
  const f = dateOnly(from);
  let year = f.getUTCFullYear();
  let month = f.getUTCMonth();

  const safeDueDay = Math.max(1, Math.min(31, Math.floor(dueDay) || 1));

  // Try the current month first; if the clamped day hasn't passed, use it.
  const lastDayCur = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const dayCur = Math.min(safeDueDay, lastDayCur);
  const candCur = new Date(Date.UTC(year, month, dayCur));
  if (candCur >= f) return candCur;

  // Otherwise advance to the next month (wrapping year if needed).
  month++;
  if (month > 11) { month = 0; year++; }
  const lastDayNext = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const dayNext = Math.min(safeDueDay, lastDayNext);
  return new Date(Date.UTC(year, month, dayNext));
}
