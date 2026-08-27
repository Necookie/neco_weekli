"use client";

import { PageHeading } from "@/components/page-heading";
import {
  RunwayHorizonChart,
  RunwayMeterCard,
  RunwaySliders,
} from "@/components/runway";
import { useAppStore } from "@/lib/store";

export function RunwayView() {
  const { dashboard: d } = useAppStore();

  return (
    <>
      <PageHeading
        title="Financial Runway"
        subtitle="Dynamic time units of survival, live spending targets, and growth horizon"
      />

      <div className="flex flex-col gap-4 lg:gap-6">
        <RunwayMeterCard d={d} />
        <RunwaySliders d={d} />
        <RunwayHorizonChart d={d} />
      </div>
    </>
  );
}
