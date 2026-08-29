"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { toMinor, toMajor, WEEKDAY_LABEL, WEEKDAY_ORDER, type Weekday } from "@neco/core";
import { AlertTriangle, Database, RotateCcw, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Field, inputCls } from "@/components/ui/field";
import { PageHeading } from "@/components/page-heading";
import { getCurrencySymbol } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { deleteAccountAction } from "@/lib/server/actions";

export function SettingsView() {
  const { user: clerkUser } = useUser();
  const { signOut: clerkSignOut, openSignIn } = useClerk();

  const { state, updateSettings, loadDemoData, resetDemo, notify } = useAppStore();

  const user = clerkUser
    ? {
        name: clerkUser.fullName || clerkUser.firstName || "User",
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
      }
    : null;

  const [income, setIncome] = useState(String(toMajor(state.settings.income)));
  const [savingsPct, setSavingsPct] = useState(String(Math.round(state.settings.savingsPct * 100)));
  const [essentialBaseline, setEssentialBaseline] = useState(
    String(toMajor(state.settings.essentialWeeklyBaselineMinor ?? 0)),
  );
  const [payday, setPayday] = useState<Weekday>(state.settings.payday);
  const [weekStart, setWeekStart] = useState<Weekday>(state.settings.weekStart);
  const [currency, setCurrency] = useState(state.settings.currency);
  const [billReminders, setBillReminders] = useState(state.settings.billReminders);
  const [rolloverEnabled, setRolloverEnabled] = useState(state.settings.rolloverEnabled);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const currencySymbol = getCurrencySymbol(currency);

  // Re-sync the staged form whenever settings change
  useEffect(() => {
    setIncome(String(toMajor(state.settings.income)));
    setSavingsPct(String(Math.round(state.settings.savingsPct * 100)));
    setEssentialBaseline(String(toMajor(state.settings.essentialWeeklyBaselineMinor ?? 0)));
    setPayday(state.settings.payday);
    setWeekStart(state.settings.weekStart);
    setCurrency(state.settings.currency);
    setBillReminders(state.settings.billReminders);
    setRolloverEnabled(state.settings.rolloverEnabled);
  }, [state.settings]);

  function handleSave() {
    const incomeMajor = Number(income);
    const pct = Number(savingsPct);
    const baselineMajor = Number(essentialBaseline);
    updateSettings({
      income:
        Number.isFinite(incomeMajor) && incomeMajor > 0
          ? toMinor(incomeMajor)
          : state.settings.income,
      savingsPct: Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) / 100 : state.settings.savingsPct,
      essentialWeeklyBaselineMinor:
        Number.isFinite(baselineMajor) && baselineMajor >= 0
          ? toMinor(baselineMajor)
          : state.settings.essentialWeeklyBaselineMinor,
      payday,
      weekStart,
      currency,
      billReminders,
      rolloverEnabled,
    });
    notify("Settings saved");
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    try {
      await deleteAccountAction();
      // The Clerk user no longer exists at this point — a hard navigation
      // (rather than clerkSignOut()) cleanly drops all client-side Clerk
      // state instead of operating on an account that's already gone.
      window.location.href = "/sign-in";
    } catch (err) {
      console.error("Failed to delete account:", err);
      notify("Couldn't delete your account. Please try again.");
      setDeletingAccount(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <>
      <PageHeading title="Settings" subtitle="Your weekly plan and preferences" />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Account & Authentication Card */}
        <section className="col-span-full rounded-xl bg-canvas p-5 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/20 text-ink">
                <ShieldCheck className="size-5 text-ink-deep" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">Account &amp; Profile</h2>
                {user ? (
                  <p className="text-xs text-mute">
                    Signed in as <strong className="text-ink">{user.name}</strong> ({user.email})
                  </p>
                ) : (
                  <p className="text-xs text-mute">Loading your account…</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/onboarding"
                className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-canvas-soft px-3.5 py-2 text-xs font-semibold text-ink transition hover:bg-black/10 active:scale-[0.98]"
              >
                <Sparkles className="size-3.5" />
                <span>Replay Onboarding Wizard</span>
              </Link>

              {user ? (
                <button
                  type="button"
                  onClick={() => clerkSignOut()}
                  className="rounded-xl bg-canvas px-3.5 py-2 text-xs font-semibold text-negative ring-1 ring-inset ring-negative/30 transition hover:bg-negative/10 active:scale-[0.98]"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openSignIn()}
                  className="rounded-xl bg-primary px-4 py-2 font-display text-xs font-extrabold text-on-primary transition hover:bg-primary-active active:scale-[0.98]"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Weekly plan */}
        <section className="rounded-xl bg-canvas p-5 lg:p-6">
          <h2 className="mb-4 text-sm font-semibold text-mute">Weekly plan</h2>
          <div className="space-y-4">
            <Field label="Weekly income">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-mute">
                  {currencySymbol}
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

            <Field
              label="Essential baseline floor"
              hint="Minimum weekly safety buffer for commute, groceries & survival."
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-mute">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={essentialBaseline}
                  onChange={(e) => setEssentialBaseline(e.target.value)}
                  className={`${inputCls} pl-8`}
                />
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

        {/* Preferences & Data Management */}
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

          {/* Dataset Tools */}
          <div className="mt-2 rounded-xl border border-black/5 bg-canvas-soft/50 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mute">
              Dataset Management
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadDemoData}
                className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-canvas px-3 py-2 text-xs font-semibold text-ink transition hover:bg-black/5 active:scale-[0.98]"
              >
                <Database className="size-3.5 text-mute" />
                <span>Load Sample Playground Data</span>
              </button>

              <button
                type="button"
                onClick={resetDemo}
                className="flex items-center gap-1.5 rounded-xl bg-canvas px-3 py-2 text-xs font-semibold text-negative ring-1 ring-inset ring-negative/30 transition hover:bg-negative/10 active:scale-[0.98]"
              >
                <RotateCcw className="size-3.5" />
                <span>Clear All (Clean Slate)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        {user && (
          <section className="col-span-full rounded-xl bg-canvas p-5 ring-1 ring-inset ring-negative/20 lg:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-negative/10 text-negative">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">Danger Zone</h2>
                <p className="text-xs text-mute">
                  Permanently delete your account and every bill, expense, and savings
                  record tied to it. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-4">
              {confirmingDelete ? (
                <div className="rounded-xl bg-negative/5 p-4 ring-1 ring-inset ring-negative/20">
                  <p className="text-sm font-semibold text-negative">
                    Are you absolutely sure? Your account and all its data will be
                    erased immediately.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount}
                      className="flex items-center gap-1.5 rounded-xl bg-negative px-4 py-2 text-xs font-bold text-white transition hover:bg-negative/90 active:scale-[0.98] disabled:opacity-60"
                    >
                      <Trash2 className="size-3.5" />
                      <span>{deletingAccount ? "Deleting…" : "Yes, delete my account"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      disabled={deletingAccount}
                      className="rounded-xl border border-black/10 bg-canvas px-4 py-2 text-xs font-semibold text-ink transition hover:bg-black/5 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-canvas px-3.5 py-2 text-xs font-semibold text-negative ring-1 ring-inset ring-negative/30 transition hover:bg-negative/10 active:scale-[0.98]"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete Account</span>
                </button>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-primary px-8 py-3.5 text-center font-display text-sm font-extrabold text-on-primary transition hover:bg-primary-active active:scale-[0.99]"
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
