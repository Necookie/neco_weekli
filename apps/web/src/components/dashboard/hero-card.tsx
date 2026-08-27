import type { Dashboard } from "@/lib/dashboard";

export function HeroCard({ d }: { d: Dashboard }) {
  const activeRunway = d.sliderSimulation.simulatedRunway ?? d.runway;
  const isHealthy = activeRunway.health === "HEALTHY";
  const isCritical = activeRunway.health === "CRITICAL";

  // Target benchmark is 12 weeks (3 months) of runway
  const runwayPct = activeRunway.isIndefinite
    ? 100
    : Math.min(100, Math.round((activeRunway.weeks / 12) * 100));

  return (
    <section className="overflow-hidden rounded-xl bg-ink text-white shadow-sm">
      {/* Top Section: Dynamic Financial Runway Engine */}
      <div className="border-b border-white/10 p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
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
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Financial Runway
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isCritical
                ? "bg-negative/20 text-negative"
                : isHealthy
                  ? "bg-primary/20 text-primary"
                  : "bg-warning/20 text-warning"
            }`}
          >
            {isCritical
              ? "Critical Buffer (<1 mo)"
              : isHealthy
                ? "Healthy Runway (3+ mos)"
                : "Moderate Buffer (1–3 mos)"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
          <p className="font-display text-[clamp(2.5rem,10vw,4rem)] font-extrabold tabular-nums leading-none tracking-tight text-white transition-all duration-300">
            {activeRunway.isIndefinite ? "∞" : activeRunway.weeks}
          </p>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold text-primary lg:text-xl">
              Weeks of Runway
            </span>
            <span className="text-xs text-white/50">
              {activeRunway.isIndefinite
                ? "Indefinite survival"
                : `≈ ${activeRunway.days} days of survival & flexibility`}
            </span>
          </div>
        </div>

        {/* Runway Buffer Meter */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>
              Liquid Pool: <strong className="text-white">{d.fmt(d.liquidPool)}</strong>
            </span>
            <span>
              Simulated Weekly Burn:{" "}
              <strong className="text-white">
                {d.fmt(activeRunway.weeklyBurn)}/wk
              </strong>
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCritical ? "bg-negative" : isHealthy ? "bg-primary" : "bg-warning"
              }`}
              style={{ width: `${Math.max(4, runwayPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section: Safe to Spend Today */}
      <div className="bg-white/5 p-5 lg:px-8 lg:py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-white/60">Safe to spend today</p>
            <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-primary lg:text-3xl">
              {d.fmt(d.cap.cap)}
            </p>
          </div>

          <div className="text-right text-xs">
            <span className="block text-white/60">
              {d.cap.daysLeft} day{d.cap.daysLeft === 1 ? "" : "s"} left this week
            </span>
            <span
              className={`mt-0.5 inline-block font-semibold ${
                d.cap.overspent ? "text-negative" : "text-primary"
              }`}
            >
              {d.cap.overspent
                ? `Over by ${d.fmt(Math.abs(d.cap.remaining))}`
                : `${d.fmt(d.cap.remaining)} left in cycle`}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
