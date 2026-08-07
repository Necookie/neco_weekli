import type { Dashboard } from "@/lib/demo";

export function BillsCard({ d }: { d: Dashboard }) {
  return (
    <section className="rounded-xl bg-canvas p-5 lg:p-6">
      <h2 className="mb-4 text-sm font-semibold text-mute">
        Bills — set aside so far
      </h2>
      <ul className="space-y-4">
        {d.billProgress.map((b) => (
          <li key={b.id}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="font-semibold text-ink">{b.title}</span>
              <span className="tabular-nums text-mute">
                {d.fmt(b.accrued)} / {d.fmt(b.monthlyAmount)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-canvas-soft">
              <div
                className={`h-full rounded-full ${
                  b.pct >= 100 ? "bg-positive" : "bg-ink"
                }`}
                style={{ width: `${b.pct > 0 ? Math.max(b.pct, 4) : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
