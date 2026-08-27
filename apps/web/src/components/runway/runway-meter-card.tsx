"use client";

import { Shield, ShieldAlert, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import type { Dashboard } from "@/lib/dashboard";

export function RunwayMeterCard({ d }: { d: Dashboard }) {
  const [mode, setMode] = useState<"normal" | "survival">("normal");

  const normalBurn = d.sliderSimulation.totalSlidersSpendMinor + d.baselineBurn.billsWeekly;
  const survivalBurn = d.sliderSimulation.slidersEssentialMinor + d.baselineBurn.billsWeekly;

  const activeWeeklyBurn = mode === "normal" ? normalBurn : survivalBurn;
  const activeWeeks =
    activeWeeklyBurn > 0
      ? Number((d.liquidPool / activeWeeklyBurn).toFixed(1))
      : Infinity;
  const activeDays =
    activeWeeklyBurn > 0
      ? Number(((d.liquidPool / activeWeeklyBurn) * 7).toFixed(1))
      : Infinity;

  const isHealthy = activeWeeks >= 12;
  const isCritical = activeWeeks < 4;

  const runwayPct =
    activeWeeks === Infinity ? 100 : Math.min(100, Math.round((activeWeeks / 12) * 100));

  return (
    <section className="overflow-hidden rounded-xl bg-ink p-6 text-white shadow-sm lg:p-8">
      {/* Top Bar: Mode Switcher & Health Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex size-2.5 rounded-full ${
              isCritical
                ? "animate-pulse bg-negative"
                : isHealthy
                  ? "bg-primary"
                  : "bg-warning"
            }`}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-white/60">
            {mode === "normal" ? "Standard Runway" : "Hardcore Survival Mode"}
          </span>
        </div>

        {/* Mode Switcher Pill */}
        <div className="inline-flex rounded-full bg-white/10 p-1">
          <button
            type="button"
            onClick={() => setMode("normal")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
              mode === "normal"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Sparkles className="size-3" />
            Normal
          </button>
          <button
            type="button"
            onClick={() => setMode("survival")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
              mode === "survival"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Zap className="size-3" />
            Survival Only
          </button>
        </div>
      </div>

      {/* Hero Display Metric */}
      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <p className="font-display text-[clamp(3rem,12vw,5.5rem)] font-extrabold tabular-nums leading-none tracking-tight text-white">
          {activeWeeks === Infinity ? "∞" : activeWeeks}
        </p>
        <div className="flex flex-col">
          <span className="font-display text-xl font-extrabold text-primary lg:text-2xl">
            Weeks of Survival
          </span>
          <span className="text-xs text-white/60">
            {activeWeeks === Infinity
              ? "Indefinite buffer (no weekly burn)"
              : `≈ ${activeDays} days of guaranteed liquidity`}
          </span>
        </div>
      </div>

      {/* Explanatory context */}
      <p className="mt-3 text-xs text-white/70">
        {mode === "normal"
          ? "Simulated with your active target allocations (discretionary dates & snacks included)."
          : "Bare-bones lockdown: covers fares, campus food & sunk bills only. Zero discretionary spend."}
      </p>

      {/* Liquid Pool vs Weekly Burn breakdown meter */}
      <div className="mt-6 rounded-xl bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-white/60">Liquid Cash Pool: </span>
            <strong className="font-semibold text-white">{d.fmt(d.liquidPool)}</strong>
          </div>
          <div>
            <span className="text-white/60">Weekly Burn Rate: </span>
            <strong className="font-semibold text-primary">{d.fmt(activeWeeklyBurn)}/wk</strong>
          </div>
        </div>

        <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical ? "bg-negative" : isHealthy ? "bg-primary" : "bg-warning"
            }`}
            style={{ width: `${Math.max(4, runwayPct)}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
          <span>0 wks</span>
          <span>Target Cushion: 12 Weeks (3 Months)</span>
          <span>24+ wks</span>
        </div>
      </div>
    </section>
  );
}
