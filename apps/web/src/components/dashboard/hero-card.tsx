import type { Dashboard } from "@/lib/dashboard";

export function HeroCard({ d }: { d: Dashboard }) {
  return (
    <section className="rounded-xl bg-ink p-6 text-white lg:p-8">
      <p className="text-sm font-medium text-white/60">Safe to spend today</p>
      <p className="mt-2 font-display text-[clamp(2.25rem,12vw,4rem)] font-extrabold tabular-nums leading-none tracking-tight text-primary">
        {d.fmt(d.cap.cap)}
      </p>
      <div className="mt-5 flex items-center justify-between text-sm">
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
            : `${d.fmt(d.cap.remaining)} left`}
        </span>
      </div>
    </section>
  );
}
