import { AppShell } from "@/components/app-shell";
import { getDashboard } from "@/lib/demo";

export default function Home() {
  const d = getDashboard();

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      {/* Hero — polarity-flipped dark card, green headline number */}
      <section className="rounded-xl bg-ink p-6 text-white">
        <p className="text-sm font-medium text-white/60">Safe to spend today</p>
        <p className="mt-2 font-display text-[clamp(2.25rem,12vw,3.25rem)] font-extrabold tabular-nums leading-none tracking-tight text-primary">
          {d.fmt(d.cap.cap)}
        </p>
        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-white/60">
            {d.cap.daysLeft} day{d.cap.daysLeft === 1 ? "" : "s"} left this week
          </span>
          <span
            className={
              d.cap.overspent ? "font-semibold text-negative" : "text-primary"
            }
          >
            {d.cap.overspent
              ? `Over by ${d.fmt(Math.abs(d.cap.remaining))}`
              : `${d.fmt(d.cap.remaining)} left`}
          </span>
        </div>
      </section>

      {/* Vault split — white cards on sage */}
      <section className="grid grid-cols-3 gap-3">
        <Vault label="Bills" value={d.fmt(d.split.billsReserve)} dot="bg-accent-orange" />
        <Vault label="Savings" value={d.fmt(d.split.savings)} dot="bg-accent-cyan" />
        <Vault label="Spend" value={d.fmt(d.split.safeToSpend)} dot="bg-positive" />
      </section>

      {/* Danger days */}
      {d.danger.length > 0 && (
        <section className="rounded-xl bg-canvas p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-[9999px] bg-negative-bg px-3 py-1 text-xs font-semibold text-white">
              At risk
            </span>
            <span className="text-sm font-semibold text-ink">
              {d.danger.length} bill{d.danger.length === 1 ? "" : "s"} won&apos;t
              be covered in time
            </span>
          </div>
          <ul className="space-y-2">
            {d.danger.map((b) => (
              <li
                key={b.billId}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-body">{b.title}</span>
                <span className="font-semibold tabular-nums text-negative-darkest">
                  short {d.fmt(b.shortfall)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Per-bill accrual */}
      <section className="rounded-xl bg-canvas p-5">
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
              <div className="h-2 overflow-hidden rounded-[9999px] bg-canvas-soft">
                <div
                  className={`h-full rounded-[9999px] ${
                    b.pct >= 100 ? "bg-positive" : "bg-ink"
                  }`}
                  style={{ width: `${Math.max(b.pct, 4)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="px-1 text-center text-xs text-mute">
        Weekli tracks and plans your money — it never holds or moves funds.
      </p>
      </div>
    </AppShell>
  );
}

function Vault({
  label,
  value,
  dot,
}: {
  label: string;
  value: string;
  dot: string;
}) {
  return (
    <div className="rounded-xl bg-canvas p-3">
      <div className="flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full ${dot}`} />
        <p className="text-xs text-mute">{label}</p>
      </div>
      <p className="mt-1 text-sm font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}
