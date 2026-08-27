"use client";

import { FREQUENCY_LABEL } from "@neco/core";
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
  const totalWeeklyBurn = useMemo(
    () => d.billProgress.reduce((s, b) => s + b.weeklyBurn, 0),
    [d.billProgress],
  );

  return (
    <>
      <PageHeading
        title="Bills & Subscriptions"
        subtitle={`${d.billProgress.length} recurring commitments · ${d.fmt(totalWeeklyBurn)}/wk normalized burn`}
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
          const freqLabel = FREQUENCY_LABEL[b.frequency ?? "MONTHLY"];
          return (
            <div key={b.id} className="rounded-xl bg-canvas p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{b.title}</p>
                    <span className="rounded bg-canvas-soft px-2 py-0.5 text-[11px] font-medium text-body">
                      {freqLabel}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-mute">
                    Due on the {ordinal(b.dueDayOfMonth)} · <span className="font-medium text-ink-deep">{d.fmt(b.weeklyBurn)}/wk</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-ink">
                    {d.fmt(b.monthlyAmount)}
                  </p>
                  <p className="text-xs text-mute">{freqLabel.toLowerCase()}</p>
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
