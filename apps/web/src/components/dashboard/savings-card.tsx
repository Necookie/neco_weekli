import { PiggyBank } from "lucide-react";
import type { Dashboard } from "@/lib/demo";

export function SavingsCard({ d }: { d: Dashboard }) {
  const s = d.savings;
  return (
    <section className="rounded-xl bg-primary-pale p-5 lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-on-primary">
            <PiggyBank className="size-4" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-deep">{s.label}</p>
            <p className="text-xs text-ink-deep/60">Savings vault</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-ink-deep">{s.pct}%</span>
      </div>

      <p className="font-display text-2xl font-extrabold tabular-nums text-ink-deep">
        {d.fmt(s.balanceMinor)}
      </p>
      <p className="mb-3 text-xs text-ink-deep/60">of {d.fmt(s.goalMinor)} goal</p>

      <div className="h-2 overflow-hidden rounded-full bg-white/60">
        <div
          className="h-full rounded-full bg-positive"
          style={{ width: `${Math.max(s.pct, 4)}%` }}
        />
      </div>
    </section>
  );
}
