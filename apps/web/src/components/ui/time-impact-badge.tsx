import type { TimeImpactResult } from "@neco/core";

export function TimeImpactBadge({
  impact,
  className = "",
}: {
  impact: TimeImpactResult;
  className?: string;
}) {
  let colorCls = "bg-black/5 text-mute";

  switch (impact.badgeVariant) {
    case "inflow":
      colorCls = "bg-positive/10 text-positive font-semibold";
      break;
    case "essential":
      colorCls = "bg-canvas-soft text-body font-medium";
      break;
    case "discretionary_burn":
      colorCls = "bg-warning/20 text-warning-deep font-semibold";
      break;
    case "neutral":
    default:
      colorCls = "bg-black/5 text-mute font-medium";
      break;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] tabular-nums tracking-tight ${colorCls} ${className}`}
      title={`Time consequence on runway: ${impact.formatted}`}
    >
      {impact.formatted}
    </span>
  );
}
