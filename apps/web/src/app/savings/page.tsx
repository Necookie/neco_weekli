import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { SavingsCard } from "@/components/dashboard/savings-card";
import { PageHeading } from "@/components/page-heading";
import { getDashboard } from "@/lib/demo";

export const metadata: Metadata = { title: "Savings · Weekli" };

const HISTORY = [
  { id: "h1", label: "Payday allocation", when: "This Mon", amountMajor: 3000 },
  { id: "h2", label: "Week rollover", when: "Last Sun", amountMajor: 180 },
  { id: "h3", label: "Payday allocation", when: "Last Mon", amountMajor: 3000 },
  { id: "h4", label: "Manual top-up", when: "2 weeks ago", amountMajor: 500 },
];

export default function SavingsPage() {
  const d = getDashboard();
  const weeklyTarget = Math.round(d.income * d.savingsPct);

  return (
    <>
      <PageHeading
        title="Savings"
        subtitle={`${d.fmt(d.savings.balanceMinor)} of ${d.fmt(d.savings.goalMinor)} goal`}
        action={
          <button
            type="button"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-display text-sm font-extrabold text-on-primary transition active:scale-[0.99]"
          >
            <Plus className="size-4" strokeWidth={3} />
            Add money
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Main column */}
        <div className="flex flex-col gap-4 lg:col-span-2 lg:gap-6">
          <SavingsCard d={d} />

          <section className="rounded-xl bg-canvas p-5 lg:p-6">
            <h2 className="mb-3 text-sm font-semibold text-mute">Contributions</h2>
            <ul className="divide-y divide-black/5">
              {HISTORY.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-ink">{h.label}</p>
                    <p className="text-xs text-mute">{h.when}</p>
                  </div>
                  <span className="font-semibold tabular-nums text-positive">
                    +{d.fmt(h.amountMajor * 100)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4 lg:gap-6">
          <section className="rounded-xl bg-ink p-6 text-white">
            <p className="text-sm text-white/60">Weekly savings target</p>
            <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-primary">
              {d.fmt(weeklyTarget)}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {Math.round(d.savingsPct * 100)}% of your weekly income
            </p>
          </section>

          <section className="rounded-xl bg-primary-pale p-5">
            <p className="text-sm font-semibold text-ink-deep">
              End-of-week rollover
            </p>
            <p className="mt-1 text-xs text-ink-deep/70">
              Leftover Safe-to-Spend is swept here every week — you&apos;re on a
              3-week streak.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
