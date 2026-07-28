import {
  Bus,
  HeartPulse,
  Receipt,
  ShoppingBag,
  ShoppingBasket,
  Utensils,
} from "lucide-react";
import type { ComponentType } from "react";
import type { Category, Dashboard } from "@/lib/demo";

const ICONS: Record<Category, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "Food & Dining": Utensils,
  Transport: Bus,
  Groceries: ShoppingBasket,
  "Bills & Utilities": Receipt,
  Health: HeartPulse,
  Shopping: ShoppingBag,
};

export function ActivityCard({ d }: { d: Dashboard }) {
  return (
    <section className="rounded-xl bg-canvas p-5 lg:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-mute">Recent activity</h2>
        <a href="#" className="text-xs font-semibold text-ink-deep">
          See all
        </a>
      </div>
      <ul className="divide-y divide-black/5">
        {d.activity.map((a) => {
          const Icon = ICONS[a.category];
          return (
            <li key={a.id} className="flex items-center gap-3 py-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-canvas-soft text-ink">
                <Icon className="size-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {a.title}
                </p>
                <p className="truncate text-xs text-mute">
                  {a.category} · {a.dayLabel}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                −{d.fmt(a.minor)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
