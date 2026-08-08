import { useMemo } from "react";
import type { Dashboard } from "@/lib/demo";

export function WeekOverview({ d }: { d: Dashboard }) {
  const { perDay, maxDay } = d.weekSpend;

  const bars = useMemo(
    () =>
      perDay.map((day) => ({
        ...day,
        h: day.minor === 0 ? 3 : Math.max(10, Math.round((day.minor / maxDay) * 100)),
      })),
    [perDay, maxDay],
  );

  return (
    <section className="rounded-xl bg-canvas p-5 lg:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-mute">This week&apos;s spending</h2>
        <span className="text-sm font-semibold tabular-nums text-ink">
          {d.fmt(d.spentThisWeek)}
        </span>
      </div>

      <div className="flex h-32 items-stretch gap-2">
        {bars.map((day) => (
          <div
            key={day.label}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <div className="flex w-full flex-1 items-end">
              <div
                className={`w-full rounded-md transition-all ${
                  day.isToday
                    ? "bg-primary"
                    : day.isFuture
                      ? "bg-canvas-soft"
                      : "bg-ink"
                }`}
                style={{ height: `${day.h}%` }}
                title={d.fmt(day.minor)}
              />
            </div>
            <span
              className={`text-[11px] ${
                day.isToday ? "font-bold text-ink" : "text-mute"
              }`}
            >
              {day.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
