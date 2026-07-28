import type { Dashboard } from "@/lib/demo";

export function VaultSplit({ d }: { d: Dashboard }) {
  const vaults = [
    { label: "Bills", value: d.fmt(d.split.billsReserve), dot: "bg-accent-orange" },
    { label: "Savings", value: d.fmt(d.split.savings), dot: "bg-accent-cyan" },
    { label: "Spend", value: d.fmt(d.split.safeToSpend), dot: "bg-positive" },
  ];
  return (
    <section className="grid grid-cols-3 gap-3 lg:gap-4">
      {vaults.map((v) => (
        <div key={v.label} className="rounded-xl bg-canvas p-3 lg:p-4">
          <div className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${v.dot}`} />
            <p className="text-xs text-mute">{v.label}</p>
          </div>
          <p className="mt-1 text-sm font-semibold tabular-nums text-ink lg:text-base">
            {v.value}
          </p>
        </div>
      ))}
    </section>
  );
}
