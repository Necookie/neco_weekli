/** Shared Tailwind class string for a styled form input/select. */
export const inputCls =
  "w-full rounded-md border border-ink bg-canvas px-4 py-3 text-sm text-ink outline-none transition focus:ring-2 focus:ring-primary/50";

import type { ReactNode } from "react";

/**
 * Accessible form field wrapper: renders a `<label>` with a visible label
 * text above `children` and an optional hint below.
 *
 * @example
 * <Field label="Weekly income" hint="Major units (e.g. 15000)">
 *   <input type="number" ... />
 * </Field>
 */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  );
}
