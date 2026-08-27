import Link from "next/link";
import type { Dashboard } from "@/lib/dashboard";

export function BillsCard({ d }: { d: Dashboard }) {
  return (
    <section className="rounded-xl bg-canvas p-5 lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-mute">
          Bills — set aside so far
        </h2>
        {d.billProgress.length > 0 && (
          <Link href="/bills" className="text-xs font-semibold text-ink-deep">
            Manage
          </Link>
        )}
      </div>

      {d.billProgress.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-xs font-semibold text-ink">No recurring commitments added yet</p>
          <p className="mt-1 text-[11px] text-mute">
            Add your subscriptions in the Bills tab or through the Onboarding wizard.
          </p>
        </div>
      ) : (
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
      )}
    </section>
  );
}
