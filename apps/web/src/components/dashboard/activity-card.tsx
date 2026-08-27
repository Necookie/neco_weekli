import Link from "next/link";
import { TimeImpactBadge } from "@/components/ui";
import type { Dashboard } from "@/lib/dashboard";
import { CategoryIcon } from "./category-icon";

export function ActivityCard({ d }: { d: Dashboard }) {
  return (
    <section className="rounded-xl bg-canvas p-5 lg:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-mute">Recent activity</h2>
        {d.activity.length > 0 && (
          <Link href="/activity" className="text-xs font-semibold text-ink-deep">
            See all
          </Link>
        )}
      </div>

      {d.activity.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs font-semibold text-ink">No expenses logged yet this week</p>
          <p className="mt-1 text-[11px] text-mute">
            Tap &quot;+ Log expense&quot; in the sidebar or menu to record daily spend.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-black/5">
          {d.activity.slice(0, 6).map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-canvas-soft text-ink">
                <CategoryIcon category={a.category} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {a.title}
                </p>
                <div className="flex items-center gap-1.5 truncate text-xs text-mute">
                  <span>{a.category}</span>
                  <span>·</span>
                  <span>{a.dayLabel}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-semibold tabular-nums text-ink">
                  −{d.fmt(a.minor)}
                </span>
                <TimeImpactBadge impact={a.timeImpact} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
