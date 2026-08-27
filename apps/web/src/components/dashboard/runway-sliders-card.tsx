"use client";

import { RotateCcw, Sliders, Sparkles, AlertCircle } from "lucide-react";
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
  { key: "commuteMajor", label: "Commute / Transit", min: 0, max: 1500, step: 25 },
  { key: "campusMealsMajor", label: "Campus Meals & Water", min: 0, max: 2500, step: 25 },
];

const DISCRETIONARY_SLIDERS: SliderConfig[] = [
  { key: "datesMajor", label: "Dates & Shared Meals", min: 0, max: 2500, step: 25 },
  { key: "snacksMajor", label: "Impulse / Snacks", min: 0, max: 1000, step: 25 },
];

export function RunwaySlidersCard({ d }: { d: Dashboard }) {
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
            <h2 className="text-sm font-semibold text-ink">Weekly Spending Targets</h2>
            <p className="text-xs text-mute">Simulate allocations to expand your runway</p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetTargetSliders}
          className="flex items-center gap-1 text-xs font-semibold text-mute transition hover:text-ink"
          title="Reset to default allocations"
        >
          <RotateCcw className="size-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Live Reactive Surplus / Deficit Banner */}
      <div
        className={`mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 text-xs transition-colors ${
          isSurplus
            ? "border border-positive/20 bg-positive/10 text-positive-deep"
            : "border border-negative/20 bg-negative/10 text-negative-darkest"
        }`}
      >
        <div className="flex items-center gap-1.5 font-semibold">
          {isSurplus ? (
            <>
              <Sparkles className="size-3.5 text-positive" />
              <span>+{d.fmt(d.sliderSimulation.surplusMinor)}/week added to Runway Pool</span>
            </>
          ) : (
            <>
              <AlertCircle className="size-3.5 text-negative" />
              <span>Deficit of −{d.fmt(Math.abs(d.sliderSimulation.surplusMinor))}/wk (Over budget)</span>
            </>
          )}
        </div>
        <span className="tabular-nums text-ink/70">
          Total: <strong className="text-ink">₱{totalAllocatedMajor.toLocaleString("en-PH")}</strong>/wk
        </span>
      </div>

      <div className="mt-5 space-y-5">
        {/* Section 1: School Essentials */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-mute">
              School Essentials (Core Survival)
            </p>
            <span className="text-[11px] font-semibold tabular-nums text-ink-deep">
              ₱{(sliders.commuteMajor + sliders.campusMealsMajor).toLocaleString("en-PH")}/wk
            </span>
          </div>
          <div className="space-y-3.5 rounded-lg bg-canvas-soft/60 p-3.5">
            {ESSENTIAL_SLIDERS.map((s) => (
              <div key={s.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">{s.label}</span>
                  <span className="rounded bg-canvas px-2 py-0.5 font-bold tabular-nums text-ink shadow-xs">
                    ₱{sliders[s.key].toLocaleString("en-PH")}
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
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-mute">
              Girlfriend &amp; Discretionary
            </p>
            <span className="text-[11px] font-semibold tabular-nums text-ink-deep">
              ₱{(sliders.datesMajor + sliders.snacksMajor).toLocaleString("en-PH")}/wk
            </span>
          </div>
          <div className="space-y-3.5 rounded-lg bg-canvas-soft/60 p-3.5">
            {DISCRETIONARY_SLIDERS.map((s) => (
              <div key={s.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">{s.label}</span>
                  <span className="rounded bg-canvas px-2 py-0.5 font-bold tabular-nums text-ink shadow-xs">
                    ₱{sliders[s.key].toLocaleString("en-PH")}
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

      {/* Footer simulation projection */}
      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-xs text-mute">
        <span>Projected Runway with Targets:</span>
        <span className="font-bold tabular-nums text-ink">
          {d.sliderSimulation.projectedWeeks} wks ({d.sliderSimulation.projectedDays} days)
        </span>
      </div>
    </section>
  );
}
