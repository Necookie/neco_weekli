/**
 * Shared string/number formatting utilities for the web app.
 *
 * Keep pure functions here — no React, no I/O, no side-effects.
 */

/**
 * Converts a number to its English ordinal string.
 * @example ordinal(1)  → "1st"
 * @example ordinal(11) → "11th"
 * @example ordinal(23) → "23rd"
 */
export function ordinal(n: number): string {
  const v = n % 100;
  // 11th, 12th, 13th are always "th" — the teens rule.
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
