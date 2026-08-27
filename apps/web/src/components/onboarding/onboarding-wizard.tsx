"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Plus,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  normalizeToWeekly,
  toMajor,
  toMinor,
  type RecurrenceFrequency,
  type Weekday,
  WEEKDAY_LABEL,
  WEEKDAY_ORDER,
} from "@neco/core";
import {
  ARCHETYPES,
  COMMON_BILL_PRESETS,
  type ArchetypePreset,
  type BillPreset,
} from "@/lib/onboarding-presets";
import { useAppStore } from "@/lib/store";
import type { TargetSliders } from "@/lib/types";

/**
 * Two steps, not four: picking an archetype pre-fills every other number
 * (bills, sliders, savings %) with sane defaults, so a brand-new user can go
 * from landing here to "Enter My Dashboard" in two taps. Fine-tuning bills
 * and daily targets is still possible — it just lives behind an optional
 * "Customize" disclosure on step 2 instead of forcing two extra required
 * screens on everyone.
 */
export function OnboardingWizard() {
  const router = useRouter();
  const { applyOnboardingSetup } = useAppStore();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 State: Archetype & Income
  const [selectedArchetype, setSelectedArchetype] = useState<string>("student");
  const [incomeMode, setIncomeMode] = useState<"weekly" | "monthly">("weekly");
  const [incomeAmountMajor, setIncomeAmountMajor] = useState<number>(2500);
  const [payday, setPayday] = useState<Weekday>("MONDAY");
  const [savingsPct, setSavingsPct] = useState<number>(15);

  // Step 2 State: Bills & Sliders — pre-filled from the archetype, editable
  // via the optional "Customize" disclosures rather than forced screens.
  const [selectedBills, setSelectedBills] = useState<BillPreset[]>(
    COMMON_BILL_PRESETS.filter((b) => b.selectedByDefault),
  );
  const [customBillTitle, setCustomBillTitle] = useState("");
  const [customBillAmount, setCustomBillAmount] = useState("");
  const [customBillFreq, setCustomBillFreq] = useState<RecurrenceFrequency>("MONTHLY");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [showCustomizeBills, setShowCustomizeBills] = useState(false);
  const [showCustomizeTargets, setShowCustomizeTargets] = useState(false);

  const [sliders, setSliders] = useState<TargetSliders>({
    commuteMajor: 350,
    campusMealsMajor: 600,
    datesMajor: 300,
    snacksMajor: 150,
  });

  // Calculate live numbers
  const weeklyIncome =
    incomeMode === "weekly"
      ? incomeAmountMajor
      : Math.round((incomeAmountMajor * 12) / 52);

  const weeklyBills = selectedBills.reduce((sum, b) => {
    return sum + toMajor(normalizeToWeekly(toMinor(b.amountMajor), b.frequency));
  }, 0);

  const weeklySavings = Math.round(weeklyIncome * (savingsPct / 100));

  const totalSliders =
    sliders.commuteMajor +
    sliders.campusMealsMajor +
    sliders.datesMajor +
    sliders.snacksMajor;

  const weeklySafeToSpend = Math.max(0, weeklyIncome - weeklyBills - weeklySavings);
  const dailyCap = Math.round(weeklySafeToSpend / 7);
  const surplus = weeklySafeToSpend - totalSliders;

  const liquidPoolMajor = 5000;
  const projectedWeeklyBurn = weeklyBills + totalSliders;
  const projectedWeeks =
    projectedWeeklyBurn > 0
      ? Number((liquidPoolMajor / projectedWeeklyBurn).toFixed(1))
      : 52;

  // Handler for Archetype selection
  function handleSelectArchetype(arch: ArchetypePreset) {
    setSelectedArchetype(arch.id);
    setIncomeAmountMajor(arch.incomeWeeklyMajor);
    setIncomeMode("weekly");
    setSavingsPct(Math.round(arch.savingsPct * 100));
    setSliders(arch.sliders);
    setSelectedBills(arch.bills);
  }

  function toggleBill(b: BillPreset) {
    const exists = selectedBills.some((x) => x.id === b.id);
    if (exists) {
      setSelectedBills(selectedBills.filter((x) => x.id !== b.id));
    } else {
      setSelectedBills([...selectedBills, b]);
    }
  }

  function handleAddCustomBill() {
    const amount = Number(customBillAmount);
    if (!customBillTitle.trim() || !Number.isFinite(amount) || amount <= 0) return;
    const newBill: BillPreset = {
      id: `custom_${Date.now()}`,
      title: customBillTitle.trim(),
      amountMajor: amount,
      frequency: customBillFreq,
      dueDayOfMonth: 1,
    };
    setSelectedBills([...selectedBills, newBill]);
    setCustomBillTitle("");
    setCustomBillAmount("");
    setShowAddCustom(false);
  }

  function handleFinish() {
    applyOnboardingSetup({
      incomeWeeklyMajor: weeklyIncome,
      savingsPct: savingsPct / 100,
      payday,
      bills: selectedBills,
      sliders,
      savingsGoalMajor: 30000,
      liquidSavingsMajor: 5000,
    });
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:py-12">
      {/* Top Stepper Pill */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? "w-8 bg-primary"
                  : s < step
                    ? "w-4 bg-primary/60"
                    : "w-4 bg-black/10"
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-mute">
          Step {step} of 2
        </span>
      </div>

      {/* ─── STEP 1: Archetype & Income Pulse ─────────────────────────────────── */}
      {step === 1 && (
        <section className="rounded-xl bg-canvas p-6 shadow-sm lg:p-8">
          <div className="mb-6">
            <span className="inline-block rounded-full bg-primary/20 px-3 py-1 font-display text-xs font-bold text-ink-deep">
              Step 1: Your Financial Pulse
            </span>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink lg:text-3xl">
              Choose your profile or start clean
            </h1>
            <p className="mt-1 text-sm text-mute">
              Pick a baseline that fits your lifestyle — it pre-fills your bills and
              targets, so you&apos;re one step from done. You can still customize every
              number.
            </p>
          </div>

          {/* Archetype Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {ARCHETYPES.map((arch) => {
              const active = selectedArchetype === arch.id;
              return (
                <button
                  key={arch.id}
                  type="button"
                  onClick={() => handleSelectArchetype(arch)}
                  className={`flex flex-col items-start rounded-xl p-4 text-left transition ${
                    active
                      ? "border-2 border-primary bg-primary-pale/40 shadow-xs"
                      : "border border-black/10 bg-canvas-soft/40 hover:bg-canvas-soft"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-2xl">{arch.icon}</span>
                    {active && <CheckCircle2 className="size-4 text-ink-deep" />}
                  </div>
                  <p className="mt-2 font-display text-sm font-bold text-ink">
                    {arch.title}
                  </p>
                  <p className="mt-0.5 text-xs text-mute">{arch.subtitle}</p>
                </button>
              );
            })}
          </div>

          {/* Income Input */}
          <div className="mt-6 space-y-4 border-t border-black/5 pt-6">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-mute">
                Weekly Income / Allowance
              </label>
              <div className="flex rounded-lg bg-canvas-soft p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setIncomeMode("weekly")}
                  className={`rounded-md px-2.5 py-1 font-semibold transition ${
                    incomeMode === "weekly" ? "bg-canvas text-ink shadow-xs" : "text-mute"
                  }`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setIncomeMode("monthly")}
                  className={`rounded-md px-2.5 py-1 font-semibold transition ${
                    incomeMode === "monthly" ? "bg-canvas text-ink shadow-xs" : "text-mute"
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg font-bold text-mute">
                ₱
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={incomeAmountMajor}
                onChange={(e) => setIncomeAmountMajor(Number(e.target.value))}
                className="w-full rounded-xl border border-black/10 bg-canvas-soft/40 py-3.5 pl-9 pr-4 font-display text-xl font-bold text-ink outline-none transition focus:border-ink focus:bg-canvas"
              />
            </div>

            {/* Payday & Savings target */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-body">
                  Primary Payday
                </label>
                <select
                  value={payday}
                  onChange={(e) => setPayday(e.target.value as Weekday)}
                  className="w-full rounded-xl border border-black/10 bg-canvas py-2.5 px-3 text-sm font-semibold text-ink outline-none focus:border-ink"
                >
                  {WEEKDAY_ORDER.map((d) => (
                    <option key={d} value={d}>
                      {WEEKDAY_LABEL[d]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-body">
                  Payday Savings Sweep ({savingsPct}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={savingsPct}
                  onChange={(e) => setSavingsPct(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-black/10 accent-primary"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-display text-sm font-extrabold text-on-primary transition hover:bg-primary-active active:scale-[0.98]"
            >
              <span>See My Plan</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </section>
      )}

      {/* ─── STEP 2: The Blueprint Reveal, with optional customization ───────── */}
      {step === 2 && (
        <section className="overflow-hidden rounded-xl bg-ink p-6 text-white shadow-sm lg:p-8">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary" />
            <p className="text-xs font-bold uppercase tracking-wider text-white/60">
              Your Weekli Blueprint
            </p>
          </div>

          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
            You&apos;re calibrated and ready.
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Based on your {ARCHETYPES.find((a) => a.id === selectedArchetype)?.title
              ?.toLowerCase() ?? "profile"}, here&apos;s your plan. Adjust anything below,
            or just enter your dashboard.
          </p>

          {/* Key Metrics Dual Card */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {/* Safe to Spend Today */}
            <div className="rounded-xl bg-white/5 p-5">
              <p className="text-xs text-white/60">Safe to Spend Today</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-primary tabular-nums">
                ₱{dailyCap.toLocaleString("en-PH")}
              </p>
              <p className="mt-1 text-[11px] text-white/50">
                ₱{weeklySafeToSpend.toLocaleString("en-PH")} weekly safe ceiling
              </p>
            </div>

            {/* Projected Runway */}
            <div className="rounded-xl bg-white/5 p-5">
              <p className="text-xs text-white/60">Projected Runway</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-white tabular-nums">
                {projectedWeeks} wks
              </p>
              <p className="mt-1 text-[11px] text-white/50">
                ≈ {Math.round(projectedWeeks * 7)} days of guaranteed liquidity
              </p>
            </div>
          </div>

          {/* 3-Vault Split Overview */}
          <div className="mt-6 space-y-2 rounded-xl bg-white/5 p-4 text-xs">
            <p className="font-semibold text-white/70">Your Weekly Payday Allocation:</p>
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-white/60">🏦 Bills &amp; Commitments Vault:</span>
              <span className="font-bold text-white tabular-nums">
                ₱{weeklyBills.toLocaleString("en-PH")}/wk
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-white/60">🐷 Savings &amp; Buffer Vault:</span>
              <span className="font-bold text-primary tabular-nums">
                ₱{weeklySavings.toLocaleString("en-PH")}/wk ({savingsPct}%)
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-white/60">☕ Guilt-free Safe-to-Spend:</span>
              <span className="font-bold text-primary tabular-nums">
                ₱{weeklySafeToSpend.toLocaleString("en-PH")}/wk
              </span>
            </div>
          </div>

          {/* ── Optional: Customize Bills ───────────────────────────────────── */}
          <div className="mt-4 rounded-xl bg-white/5">
            <button
              type="button"
              onClick={() => setShowCustomizeBills((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white/70"
            >
              <span>Customize Bills &amp; Subscriptions</span>
              <ChevronDown
                className={`size-4 transition-transform ${showCustomizeBills ? "rotate-180" : ""}`}
              />
            </button>

            {showCustomizeBills && (
              <div className="border-t border-white/10 p-4">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {COMMON_BILL_PRESETS.map((b) => {
                    const active = selectedBills.some((x) => x.id === b.id);
                    const weeklyCost = toMajor(
                      normalizeToWeekly(toMinor(b.amountMajor), b.frequency),
                    );
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => toggleBill(b)}
                        className={`flex items-center justify-between rounded-xl p-3 text-left text-xs transition ${
                          active
                            ? "border-2 border-primary bg-primary/10"
                            : "border border-white/10 bg-white/0 hover:bg-white/5"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-white">{b.title}</p>
                          <p className="text-[11px] text-white/50">
                            ₱{b.amountMajor}/{b.frequency.toLowerCase()}
                          </p>
                        </div>
                        <span className="rounded bg-white/10 px-2 py-0.5 font-bold tabular-nums text-white">
                          ₱{weeklyCost}/wk
                        </span>
                      </button>
                    );
                  })}
                </div>

                {showAddCustom ? (
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <input
                        type="text"
                        placeholder="e.g. Gym, Rent"
                        value={customBillTitle}
                        onChange={(e) => setCustomBillTitle(e.target.value)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-white/40 focus:border-white/30"
                      />
                      <input
                        type="number"
                        placeholder="Amount ₱"
                        value={customBillAmount}
                        onChange={(e) => setCustomBillAmount(e.target.value)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-white/40 focus:border-white/30"
                      />
                      <select
                        value={customBillFreq}
                        onChange={(e) => setCustomBillFreq(e.target.value as RecurrenceFrequency)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/30"
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="BIWEEKLY">Biweekly</option>
                        <option value="ANNUALLY">Annually</option>
                      </select>
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddCustom(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomBill}
                        className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-on-primary"
                      >
                        Add Bill
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(true)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 py-2 text-xs font-semibold text-white/60 hover:border-white/40 hover:text-white"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Custom Subscription or Sunk Cost</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Optional: Customize Daily Targets ───────────────────────────── */}
          <div className="mt-3 rounded-xl bg-white/5">
            <button
              type="button"
              onClick={() => setShowCustomizeTargets((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white/70"
            >
              <span>Customize Daily Spending Targets</span>
              <ChevronDown
                className={`size-4 transition-transform ${showCustomizeTargets ? "rotate-180" : ""}`}
              />
            </button>

            {showCustomizeTargets && (
              <div className="space-y-3 border-t border-white/10 p-4">
                {(
                  [
                    ["commuteMajor", "Commute / Transit", 1500],
                    ["campusMealsMajor", "Campus Meals & Water", 2500],
                    ["datesMajor", "Dates & Shared Meals", 2500],
                    ["snacksMajor", "Impulse / Personal Snacks", 1000],
                  ] as const
                ).map(([key, label, max]) => (
                  <div key={key} className="space-y-1.5 rounded-xl bg-white/5 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{label}</span>
                      <span className="rounded bg-white/10 px-2.5 py-0.5 font-bold tabular-nums text-white">
                        ₱{sliders[key]}/wk
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={max}
                      step={25}
                      value={sliders[key]}
                      onChange={(e) =>
                        setSliders({ ...sliders, [key]: Number(e.target.value) })
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-primary"
                    />
                  </div>
                ))}

                <div
                  className={`flex items-center justify-between rounded-xl p-3 text-xs font-semibold ${
                    surplus >= 0 ? "bg-primary/10 text-primary" : "bg-negative/20 text-negative"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-4" />
                    <span>
                      {surplus >= 0
                        ? `+₱${surplus.toLocaleString("en-PH")}/week added to Runway Pool`
                        : `Deficit of −₱${Math.abs(surplus).toLocaleString("en-PH")}/wk (Over budget)`}
                    </span>
                  </div>
                  <span>Total: ₱{totalSliders}/wk</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-display text-base font-extrabold text-on-primary transition hover:bg-primary-active active:scale-[0.98]"
            >
              <span>Enter My Dashboard</span>
              <ArrowRight className="size-5" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
