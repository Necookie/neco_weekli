"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { ordinal } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { AddBillModal } from "./add-bill-modal";

export function BillsView() {
  const { dashboard: d } = useAppStore();
  const [addOpen, setAddOpen] = useState(false);
  const atRisk = useMemo(
    () => new Set(d.danger.map((x) => x.billId)),
    [d.danger],
  );
  const totalMonthly = useMemo(
    () => d.billProgress.reduce((s, b) => s + b.monthlyAmount, 0),
    [d.billProgress],
  );

  return (
    <>
      <PageHeading
        title="Bills"
        subtitle={`${d.billProgress.length} subscriptions · ${d.fmt(totalMonthly)}/mo`}
        action={
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-display text-sm font-extrabold text-on-primary transition active:scale-[0.99]"
          >
            <Plus className="size-4" strokeWidth={3} />
            Add bill
          </button>
        }
      />

      <div className="flex flex-col gap-3 lg:gap-4">
        {d.billProgress.map((b) => {
          const risk = atRisk.has(b.id);
          return (
            <div key={b.id} className="rounded-xl bg-canvas p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{b.title}</p>
                  <p className="text-xs text-mute">
                    Due on the {ordinal(b.dueDayOfMonth)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-ink">
                    {d.fmt(b.monthlyAmount)}
                  </p>
                  <p className="text-xs text-mute">per month</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span
                  className={
                    risk
                      ? "font-semibold text-negative-darkest"
                      : "text-mute"
                  }
                >
                  {risk ? "At risk — won't be covered in time" : `${d.fmt(b.accrued)} set aside`}
                </span>
                <span className="tabular-nums text-mute">{b.pct}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas-soft">
                <div
                  className={`h-full rounded-full ${
                    b.pct >= 100 ? "bg-positive" : risk ? "bg-negative" : "bg-ink"
                  }`}
                  style={{ width: `${b.pct > 0 ? Math.max(b.pct, 4) : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <AddBillModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
