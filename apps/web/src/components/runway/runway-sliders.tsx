"use client";

import {
  RotateCcw,
  Sliders,
  Sparkles,
  AlertCircle,
  Receipt,
} from "lucide-react";
import { toMinor } from "@neco/core";
import type { Dashboard } from "@/lib/dashboard";
import { useAppStore } from "@/lib/store";
import type { TargetSliders } from "@/lib/types";

interface SliderConfig {
  key: keyof TargetSliders;
  label: string;
  min: number;
  max: number;
  step: number;
}

const ESSENTIAL_SLIDERS: SliderConfig[] = [
  { key: "commuteMajor", label: "Commute / Fare", min: 0, max: 1500, step: 25 },
  { key: "campusMealsMajor", label: "Campus Meals & Food", min: 0, max: 2500, step: 25 },
];

const DISCRETIONARY_SLIDERS: SliderConfig[] = [
  { key: "datesMajor", label: "Dates & Shared Meals", min: 0, max: 2500, step: 25 },
  { key: "snacksMajor", label: "Impulse / Treats", min: 0, max: 1000, step: 25 },
];

export function RunwaySliders({ d }: { d: Dashboard }) {
  const { state, updateTargetSliders, resetTargetSliders } = useAppStore();
  const sliders = state.targetSliders;

  const totalAllocatedMajor =
    sliders.commuteMajor +
    sliders.campusMealsMajor +
    sliders.datesMajor +
    sliders.snacksMajor;

  const isSurplus = d.sliderSimulation.surplusMinor >= 0;

  return (
    <section className="rounded-xl bg-canvas p-5 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-primary/20 text-ink">
            <Sliders className="size-4 text-ink-deep" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Interactive Target Sliders</h2>
            <p className="text-xs text-mute">Adjust targets to simulate weekly surplus and runway extension</p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetTargetSliders}
          className="flex items-center gap-1 text-xs font-semibold text-mute transition hover:text-ink"
          title="Reset to default targets"
        >
          <RotateCcw className="size-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Live Reactive Surplus / Deficit Banner */}
      <div
        className={`mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl p-3.5 text-xs transition-colors ${
          isSurplus
            ? "border border-positive/20 bg-positive/10 text-positive-deep"
            : "border border-negative/20 bg-negative/10 text-negative-darkest"
        }`}
      >
        <div className="flex items-center gap-1.5 font-semibold">
          {isSurplus ? (
            <>
              <Sparkles className="size-4 text-positive" />
              <span>+{d.fmt(d.sliderSimulation.surplusMinor)}/week added to Runway Pool</span>
            </>
          ) : (
            <>
              <AlertCircle className="size-4 text-negative" />
              <span>Deficit of −{d.fmt(Math.abs(d.sliderSimulation.surplusMinor))}/wk (Over budget)</span>
            </>
          )}
        </div>
        <span className="tabular-nums text-ink/70">
          Total Target: <strong className="text-ink">{d.fmt(toMinor(totalAllocatedMajor))}</strong>/wk
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Section 1: School Essentials (Core Survival) */}
        <div className="rounded-xl bg-canvas-soft/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-mute">
              Survival Core (Commute &amp; Meals)
            </p>
            <span className="text-xs font-bold tabular-nums text-ink-deep">
              {d.fmt(toMinor(sliders.commuteMajor + sliders.campusMealsMajor))}/wk
            </span>
          </div>
          <div className="space-y-4">
            {ESSENTIAL_SLIDERS.map((s) => (
              <div key={s.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">{s.label}</span>
                  <span className="rounded bg-canvas px-2.5 py-0.5 font-bold tabular-nums text-ink shadow-xs">
                    {d.fmt(toMinor(sliders[s.key]))}
                  </span>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={sliders[s.key]}
                  onChange={(e) =>
                    updateTargetSliders({ [s.key]: Number(e.target.value) })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-black/10 accent-primary"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Girlfriend & Discretionary */}
        <div className="rounded-xl bg-canvas-soft/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-mute">
              Girlfriend &amp; Discretionary
            </p>
            <span className="text-xs font-bold tabular-nums text-ink-deep">
              {d.fmt(toMinor(sliders.datesMajor + sliders.snacksMajor))}/wk
            </span>
          </div>
          <div className="space-y-4">
            {DISCRETIONARY_SLIDERS.map((s) => (
              <div key={s.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">{s.label}</span>
                  <span className="rounded bg-canvas px-2.5 py-0.5 font-bold tabular-nums text-ink shadow-xs">
                    {d.fmt(toMinor(sliders[s.key]))}
                  </span>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={sliders[s.key]}
                  onChange={(e) =>
                    updateTargetSliders({ [s.key]: Number(e.target.value) })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-black/10 accent-primary"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sinking Commitments Preview Accordion / Chip */}
      <div className="mt-5 rounded-xl border border-black/5 bg-canvas p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-mute" />
            <span className="text-xs font-semibold text-ink">
              Normalized Sunk Commitments
            </span>
          </div>
          <span className="text-xs font-bold tabular-nums text-ink">
            {d.fmt(d.baselineBurn.billsWeekly)}/week
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {d.billProgress.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-1.5 rounded-lg bg-canvas-soft px-2.5 py-1 text-xs text-body"
            >
              <span className="font-medium text-ink">{b.title}</span>
              <span className="font-bold tabular-nums text-ink-deep">
                {d.fmt(b.weeklyBurn)}/wk
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
