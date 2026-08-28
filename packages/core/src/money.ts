/**
 * Money is always an INTEGER number of minor units (e.g. centavos).
 * Never store money as a float — `0.1 + 0.2 !== 0.3` will corrupt a budget.
 */
export type Money = number;

/** ₱15,000.00 -> 1_500_000 minor units. */
export const toMinor = (major: number): Money => Math.round(major * 100);

/** 1_500_000 minor units -> 15000 (major). */
export const toMajor = (m: Money): number => m / 100;

export const addMoney = (...xs: Money[]): Money => xs.reduce((a, b) => a + b, 0);

/** Floor a value at `min` (default 0) — Safe-to-Spend never shows negative. */
export const clampMin = (m: Money, min: Money = 0): Money => {
  if (!Number.isFinite(m)) return min;
  return m < min ? min : m;
};

const _fmtCache = new Map<string, Intl.NumberFormat>();

export function formatMoney(
  m: Money,
  currency = "PHP",
  locale = "en-PH",
): string {
  const safeM = Number.isFinite(m) ? m : 0;
  const key = `${locale}:${currency}`;
  let fmt = _fmtCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, { style: "currency", currency });
    _fmtCache.set(key, fmt);
  }
  const major = safeM === 0 ? 0 : safeM / 100;
  return fmt.format(major);
}

/**
 * Split `amount` across `weights` with zero rounding loss (largest-remainder
 * method). The returned parts always sum exactly to `amount`.
 */
export function allocate(amount: Money, weights: number[]): Money[] {
  if (weights.length === 0) return [];
  const out = weights.map(() => 0);
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return out;
  // Fast path: with a single slot, the entire amount goes there.
  if (weights.length === 1) return [amount];

  const raw = weights.map((w) => (amount * w) / total);
  raw.forEach((v, i) => {
    out[i] = Math.floor(v);
  });

  let remainder = amount - out.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  let k = 0;
  while (remainder > 0 && order.length > 0) {
    const idx = order[k % order.length]!.i;
    out[idx] = (out[idx] ?? 0) + 1;
    remainder--;
    k++;
  }
  return out;
}
