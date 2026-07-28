import { getDashboard } from "@/lib/demo";

export default function Home() {
  const d = getDashboard();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-24 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Weekli
          </p>
          <h1 className="text-lg font-semibold">This week</h1>
        </div>
        <div className="grid size-9 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-slate-900">
          N
        </div>
      </header>

      {/* Safe-to-spend hero */}
      <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/10 dark:bg-slate-800">
        <p className="text-sm text-slate-300">Safe to spend today</p>
        <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight">
          {d.fmt(d.cap.cap)}
        </p>
        <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
          <span>{d.cap.daysLeft} day(s) left this week</span>
          <span className={d.cap.overspent ? "text-red-400" : "text-emerald-400"}>
            {d.cap.overspent
              ? `Over by ${d.fmt(Math.abs(d.cap.remaining))}`
              : `${d.fmt(d.cap.remaining)} remaining`}
          </span>
        </div>
      </section>

      {/* Vault split */}
      <section className="grid grid-cols-3 gap-3">
        <Vault label="Bills" value={d.fmt(d.split.billsReserve)} color="text-indigo-500" />
        <Vault label="Savings" value={d.fmt(d.split.savings)} color="text-amber-500" />
        <Vault label="Spend" value={d.fmt(d.split.safeToSpend)} color="text-emerald-500" />
      </section>

      {/* Danger days */}
      {d.danger.length > 0 && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
            ⚠ {d.danger.length} bill(s) at risk
          </p>
          <ul className="mt-2 space-y-1 text-sm text-red-700/90 dark:text-red-300/90">
            {d.danger.map((b) => (
              <li key={b.billId} className="flex justify-between">
                <span>{b.title}</span>
                <span>short {d.fmt(b.shortfall)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Per-bill accrual */}
      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800/60">
        <h2 className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-300">
          Bills — set aside so far
        </h2>
        <ul className="space-y-3">
          {d.billProgress.map((b) => (
            <li key={b.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">{b.title}</span>
                <span className="tabular-nums text-slate-500">
                  {d.fmt(b.accrued)} / {d.fmt(b.monthlyAmount)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${b.pct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="px-1 text-center text-xs text-slate-400">
        Weekli tracks and plans your money — it never holds or moves funds.
      </p>

      {/* Bottom quick-log bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="w-full rounded-2xl bg-emerald-500 py-4 text-center text-base font-semibold text-white shadow-lg shadow-emerald-500/30 active:scale-[0.99]"
        >
          + Log expense
        </button>
      </div>
    </main>
  );
}

function Vault({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm dark:bg-slate-800/60">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}
