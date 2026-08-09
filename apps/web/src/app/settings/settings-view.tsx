"use client";

import { toMinor, toMajor, WEEKDAY_LABEL, WEEKDAY_ORDER, type Weekday } from "@neco/core";
import { useEffect, useState } from "react";
import { Field, inputCls } from "@/components/ui/field";
import { PageHeading } from "@/components/page-heading";
import { useAppStore } from "@/lib/store";

export function SettingsView() {
  const { state, updateSettings, resetDemo, notify } = useAppStore();
  const [income, setIncome] = useState(String(toMajor(state.settings.income)));
  const [savingsPct, setSavingsPct] = useState(String(Math.round(state.settings.savingsPct * 100)));
  const [payday, setPayday] = useState<Weekday>(state.settings.payday);
  const [weekStart, setWeekStart] = useState<Weekday>(state.settings.weekStart);
  const [currency, setCurrency] = useState(state.settings.currency);
  const [billReminders, setBillReminders] = useState(state.settings.billReminders);
  const [rolloverEnabled, setRolloverEnabled] = useState(state.settings.rolloverEnabled);

  // Re-sync the staged form whenever the underlying settings change from
  // outside this form (e.g. Sign out resetting to defaults).
  useEffect(() => {
    setIncome(String(toMajor(state.settings.income)));
    setSavingsPct(String(Math.round(state.settings.savingsPct * 100)));
    setPayday(state.settings.payday);
    setWeekStart(state.settings.weekStart);
    setCurrency(state.settings.currency);
    setBillReminders(state.settings.billReminders);
    setRolloverEnabled(state.settings.rolloverEnabled);
  }, [state.settings]);

  function handleSave() {
    const incomeMajor = Number(income);
    const pct = Number(savingsPct);
    updateSettings({
      income:
        Number.isFinite(incomeMajor) && incomeMajor > 0
          ? toMinor(incomeMajor)
          : state.settings.income,
      savingsPct: Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) / 100 : state.settings.savingsPct,
      payday,
      weekStart,
      currency,
      billReminders,
      rolloverEnabled,
    });
    notify("Settings saved");
  }

  function handleSignOut() {
    resetDemo();
  }

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
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className={`${inputCls} pl-8`}
                />
              </div>
            </Field>

            <Field label="Payday">
              <select
                value={payday}
                onChange={(e) => setPayday(e.target.value as Weekday)}
                className={inputCls}
              >
                {WEEKDAY_ORDER.map((day) => (
                  <option key={day} value={day}>
                    {WEEKDAY_LABEL[day]}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Savings target"
              hint="Set aside automatically on every payday."
            >
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="100"
                  value={savingsPct}
                  onChange={(e) => setSavingsPct(e.target.value)}
                  className={`${inputCls} pr-8`}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-mute">
                  %
                </span>
              </div>
            </Field>

            <Field label="Currency">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputCls}
              >
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
            <select
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value as Weekday)}
              className={inputCls}
            >
              {WEEKDAY_ORDER.map((day) => (
                <option key={day} value={day}>
                  {WEEKDAY_LABEL[day]}
                </option>
              ))}
            </select>
          </Field>

          <label className="flex items-center justify-between gap-4 rounded-md border border-ink px-4 py-3">
            <span className="text-sm font-semibold text-ink">
              Bill due reminders
            </span>
            <input
              type="checkbox"
              checked={billReminders}
              onChange={(e) => setBillReminders(e.target.checked)}
              className="size-5 accent-primary"
            />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-md border border-ink px-4 py-3">
            <span className="text-sm font-semibold text-ink">
              End-of-week rollover to savings
            </span>
            <input
              type="checkbox"
              checked={rolloverEnabled}
              onChange={(e) => setRolloverEnabled(e.target.checked)}
              className="size-5 accent-primary"
            />
          </label>
        </section>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-xl bg-canvas px-6 py-3 text-center text-sm font-semibold text-ink ring-1 ring-inset ring-ink transition active:scale-[0.99]"
        >
          Sign out
        </button>
        <button
          type="button"
          onClick={handleSave}
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
