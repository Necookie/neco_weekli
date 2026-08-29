"use client";

import { CheckCircle2, Milestone, TrendingUp } from "lucide-react";
import type { Dashboard } from "@/lib/dashboard";

export function RunwayHorizonChart({ d }: { d: Dashboard }) {
  const surplusWeekly = d.sliderSimulation.surplusMinor;
  const currentPool = d.liquidPool;
  const weeklyBurn =
    d.sliderSimulation.totalSlidersSpendMinor + d.baselineBurn.billsWeekly;

  // Horizon projections across 4, 8, 12, 16, 24 weeks
  const weeksHorizon = [4, 8, 12, 16, 24];
  const projections = weeksHorizon.map((w) => {
    const projectedPool = Math.max(0, currentPool + surplusWeekly * w);
    const projectedWeeks =
      weeklyBurn > 0
        ? Number((projectedPool / weeklyBurn).toFixed(1))
        : Infinity;
    return {
      week: w,
      projectedPool,
      projectedWeeks,
    };
  });

  const maxProjected = Math.max(
    1,
    ...projections.map((p) => p.projectedPool),
    currentPool,
  );

  // Milestones targets
  const milestones = [
    {
      title: "1-Month Safety Buffer",
      targetMinor: weeklyBurn * 4,
      desc: "Covers 4 full weeks of survival",
    },
    {
      title: "3-Month Safety Cushion",
      targetMinor: weeklyBurn * 12,
      desc: "The gold standard 12-week runway",
    },
    {
      title: `${d.fmt(d.savings.goalMinor)} Emergency Reserve`,
      targetMinor: d.savings.goalMinor,
      desc: "Full long-term rainy day fund",
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      {/* Visual Horizon Growth Projection */}
      <section className="rounded-xl bg-canvas p-5 lg:p-6">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-primary/20 text-ink">
            <TrendingUp className="size-4 text-ink-deep" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Runway Horizon Projection</h2>
            <p className="text-xs text-mute">Projected cash pool growth based on weekly surplus</p>
          </div>
        </div>

        <div className="mt-6 flex h-48 items-end gap-3 rounded-xl bg-canvas-soft/50 p-4">
          {projections.map((p) => {
            const heightPct = Math.max(12, Math.round((p.projectedPool / maxProjected) * 100));
            const runwayLabel = p.projectedWeeks === Infinity ? "∞" : `${p.projectedWeeks}w`;
            return (
              <div key={p.week} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-bold tabular-nums text-ink">
                  {d.fmt(p.projectedPool).replace(/\.00$/, "")}
                </span>
                <div className="w-full overflow-hidden rounded-t-lg bg-canvas-soft">
                  <div
                    className="w-full rounded-t-lg bg-primary transition-all duration-500 hover:bg-primary-active"
                    style={{ height: `${heightPct}%` }}
                    title={`Week ${p.week}: ${d.fmt(p.projectedPool)} (${p.projectedWeeks === Infinity ? "∞" : p.projectedWeeks} wks runway)`}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-ink">+{p.week}w</p>
                  <p className="text-[9px] text-mute">{runwayLabel} run</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-mute">
          <span>Current Pool: <strong className="text-ink">{d.fmt(currentPool)}</strong></span>
          <span>
            Net Surplus:{" "}
            <strong className={surplusWeekly >= 0 ? "text-positive" : "text-negative"}>
              {surplusWeekly >= 0 ? `+${d.fmt(surplusWeekly)}/wk` : `−${d.fmt(Math.abs(surplusWeekly))}/wk`}
            </strong>
          </span>
        </div>
      </section>

      {/* Milestone Timeline */}
      <section className="rounded-xl bg-canvas p-5 lg:p-6">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-primary/20 text-ink">
            <Milestone className="size-4 text-ink-deep" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Runway Milestones</h2>
            <p className="text-xs text-mute">Pace of progress toward financial cushion goals</p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-black/5">
          {milestones.map((m) => {
            const isCompleted = m.targetMinor <= 0 ? true : currentPool >= m.targetMinor;
            const remainingMinor = Math.max(0, m.targetMinor - currentPool);
            const weeksToHit =
              isCompleted
                ? 0
                : surplusWeekly > 0
                  ? Math.ceil(remainingMinor / surplusWeekly)
                  : Infinity;
            const pctDone =
              m.targetMinor > 0
                ? Math.min(100, Math.round((currentPool / m.targetMinor) * 100))
                : 100;

            return (
              <div key={m.title} className="py-3.5 first:pt-2 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink">{m.title}</p>
                      {isCompleted && (
                        <span className="flex items-center gap-1 rounded-full bg-positive/10 px-2 py-0.5 text-[10px] font-bold text-positive">
                          <CheckCircle2 className="size-3" />
                          Achieved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-mute">{m.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-ink">
                      {d.fmt(m.targetMinor)}
                    </p>
                    <p className="text-xs text-mute">
                      {isCompleted
                        ? "Unlocked"
                        : weeksToHit === Infinity
                          ? "No surplus"
                          : `≈ ${weeksToHit} weeks`}
                    </p>
                  </div>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-canvas-soft">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted ? "bg-positive" : "bg-primary"
                    }`}
                    style={{ width: `${Math.max(4, pctDone)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
