"use client";

import { CategoryIcon } from "@/components/dashboard/category-icon";
import { PageHeading } from "@/components/page-heading";
import { type Dashboard } from "@/lib/demo";
import { useAppStore } from "@/lib/store";

const FULL_DAY = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

type ActivityItem = Dashboard["activity"][number];

export function ActivityView() {
  const { dashboard: d } = useAppStore();

  const byDay = new Map<number, ActivityItem[]>();
  for (const a of d.activity) {
    const arr = byDay.get(a.dayIndex) ?? [];
    arr.push(a);
    byDay.set(a.dayIndex, arr);
  }
  const days = [...byDay.entries()].sort((a, b) => b[0] - a[0]);
  const total = d.activity.reduce((s, a) => s + a.minor, 0);

  return (
    <>
      <PageHeading
        title="Activity"
        subtitle={`${d.activity.length} expenses this week · ${d.fmt(total)}`}
      />

      <div className="flex flex-col gap-5">
        {days.map(([dayIndex, items]) => (
          <div key={dayIndex}>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-mute">
              {FULL_DAY[dayIndex]}
            </p>
            <div className="divide-y divide-black/5 rounded-xl bg-canvas">
              {items.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-canvas-soft text-ink">
                    <CategoryIcon category={a.category} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {a.title}
                    </p>
                    <p className="truncate text-xs text-mute">{a.category}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                    −{d.fmt(a.minor)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
