"use client";

import { PageHeading } from "@/components/page-heading";
import { RunwayMeterCard } from "@/components/runway";
import { useAppStore } from "@/lib/store";

export function RunwayView() {
  const { dashboard: d } = useAppStore();

  return (
    <>
      <PageHeading
        title="Financial Runway"
        subtitle="Dynamic time units of survival and normalized weekly accrual tracking"
      />

      <div className="flex flex-col gap-4 lg:gap-6">
        <RunwayMeterCard d={d} />
      </div>
    </>
  );
}
