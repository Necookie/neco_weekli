"use client";

import { CategoryIcon } from "@/components/dashboard/category-icon";
import { PageHeading } from "@/components/page-heading";
import { TimeImpactBadge } from "@/components/ui";
import { type Dashboard } from "@/lib/dashboard";
import { useAppStore } from "@/lib/store";

type ActivityItem = Dashboard["activity"][number];

export function ActivityView() {
  const { dashboard: d } = useAppStore();

  const byDay = d.activity.reduce<Map<number, ActivityItem[]>>((acc, a) => {
    const arr = acc.get(a.dayIndex) ?? [];
    arr.push(a);
    acc.set(a.dayIndex, arr);
    return acc;
  }, new Map());
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
              {items[0]?.dayFullLabel || "Unknown"}
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
                    <div className="flex items-center gap-2 text-xs text-mute">
                      <span>{a.category}</span>
                      {a.isEssential && (
                        <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-medium text-mute">
                          Essential
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold tabular-nums text-ink">
                      −{d.fmt(a.minor)}
                    </span>
                    <TimeImpactBadge impact={a.timeImpact} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

