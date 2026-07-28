import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHeading } from "@/components/page-heading";
import { getDashboard } from "@/lib/demo";

export const metadata: Metadata = { title: "Settings · Weekli" };

const WEEKDAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

const inputCls =
  "w-full rounded-md border border-ink bg-canvas px-4 py-3 text-sm text-ink outline-none transition focus:ring-2 focus:ring-primary/50";

function Field({
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

export default function SettingsPage() {
  const d = getDashboard();

  return (
    <>
      <PageHeading title="Settings" subtitle="Your weekly plan and preferences" />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Weekly plan */}
        <section className="rounded-xl bg-canvas p-5 lg:p-6">
          <h2 className="mb-4 text-sm font-semibold text-mute">Weekly plan</h2>
          <div className="space-y-4">
            <Field label="Weekly income">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-mute">
                  ₱
                </span>
                <input
                  type="text"
                  defaultValue={(d.income / 100).toLocaleString()}
                  className={`${inputCls} pl-8`}
                />
              </div>
            </Field>

            <Field label="Payday">
              <select defaultValue="Monday" className={inputCls}>
                {WEEKDAYS.map((day) => (
                  <option key={day}>{day}</option>
                ))}
              </select>
            </Field>

            <Field
              label="Savings target"
              hint="Set aside automatically on every payday."
            >
              <div className="relative">
                <input
                  type="text"
                  defaultValue={Math.round(d.savingsPct * 100)}
                  className={`${inputCls} pr-8`}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-mute">
                  %
                </span>
              </div>
            </Field>

            <Field label="Currency">
              <select defaultValue={d.currency} className={inputCls}>
                <option value="PHP">PHP — Philippine Peso</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </Field>
          </div>
        </section>

        {/* Preferences */}
        <section className="flex flex-col gap-4 rounded-xl bg-canvas p-5 lg:p-6">
          <h2 className="text-sm font-semibold text-mute">Preferences</h2>

          <Field label="Week starts on">
            <select defaultValue="Monday" className={inputCls}>
              {WEEKDAYS.map((day) => (
                <option key={day}>{day}</option>
              ))}
            </select>
          </Field>

          <label className="flex items-center justify-between gap-4 rounded-md border border-ink px-4 py-3">
            <span className="text-sm font-semibold text-ink">
              Bill due reminders
            </span>
            <input type="checkbox" defaultChecked className="size-5 accent-primary" />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-md border border-ink px-4 py-3">
            <span className="text-sm font-semibold text-ink">
              End-of-week rollover to savings
            </span>
            <input type="checkbox" defaultChecked className="size-5 accent-primary" />
          </label>
        </section>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="rounded-xl bg-canvas px-6 py-3 text-center text-sm font-semibold text-ink ring-1 ring-inset ring-ink transition active:scale-[0.99]"
        >
          Sign out
        </button>
        <button
          type="button"
          className="rounded-xl bg-primary px-6 py-3 text-center font-display text-sm font-extrabold text-on-primary transition active:scale-[0.99]"
        >
          Save changes
        </button>
      </div>

      <p className="mt-6 px-1 text-center text-xs text-mute">
        Weekli tracks and plans your money — it never holds or moves funds.
      </p>
    </>
  );
}
