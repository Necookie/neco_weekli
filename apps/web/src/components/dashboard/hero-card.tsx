import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import type { Dashboard } from "@/lib/dashboard";

export function HeroCard({ d }: { d: Dashboard }) {
  const activeRunway = d.sliderSimulation.simulatedRunway ?? d.runway;
  const isHealthy = activeRunway.health === "HEALTHY";
  const isCritical = activeRunway.health === "CRITICAL";

  return (
    <section className="rounded-xl bg-ink p-6 text-white lg:p-8">
      {/* Top row: Label + Runway Tab Quick Link */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-white/60">Safe to spend today</p>

        {/* Lightweight Runway Chip linking to the dedicated tab */}
        <Link
          href="/runway"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 transition hover:bg-white/20 hover:text-white"
        >
          <span
            className={`size-2 rounded-full ${
              isCritical
                ? "bg-negative animate-pulse"
                : isHealthy
                  ? "bg-primary"
                  : "bg-warning"
            }`}
          />
          <span className="tabular-nums text-primary font-bold">
            {activeRunway.weeks} wks
          </span>
          <span className="text-white/60">runway</span>
          <ArrowRight className="size-3 text-white/60" />
        </Link>
      </div>

      {/* Main Safe to Spend Big Headline */}
      <p className="mt-2 font-display text-[clamp(2.5rem,12vw,4.5rem)] font-extrabold tabular-nums leading-none tracking-tight text-primary">
        {d.fmt(d.cap.cap)}
      </p>

      {/* Footer Info */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-sm">
        <span className="text-white/60">
          {d.cap.daysLeft} day{d.cap.daysLeft === 1 ? "" : "s"} left this week
        </span>
        <span
          className={
            d.cap.overspent ? "font-semibold text-negative" : "text-primary"
          }
        >
          {d.cap.overspent
            ? `Over by ${d.fmt(Math.abs(d.cap.remaining))}`
            : `${d.fmt(d.cap.remaining)} left in cycle`}
        </span>
      </div>
    </section>
  );
}
