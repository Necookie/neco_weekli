import type { Dashboard } from "@/lib/demo";

export function DangerCard({ d }: { d: Dashboard }) {
  if (d.danger.length === 0) return null;
  return (
    <section className="rounded-xl bg-canvas p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-negative-bg px-3 py-1 text-xs font-semibold text-white">
          At risk
        </span>
        <span className="text-sm font-semibold text-ink">
          {d.danger.length} bill{d.danger.length === 1 ? "" : "s"} won&apos;t be
          covered in time
        </span>
      </div>
      <ul className="space-y-2">
        {d.danger.map((b) => (
          <li key={b.billId} className="flex items-center justify-between text-sm">
            <span className="text-body">{b.title}</span>
            <span className="font-semibold tabular-nums text-negative-darkest">
              short {d.fmt(b.shortfall)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
