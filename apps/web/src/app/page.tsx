import { AppShell } from "@/components/app-shell";
import { ActivityCard } from "@/components/dashboard/activity-card";
import { BillsCard } from "@/components/dashboard/bills-card";
import { DangerCard } from "@/components/dashboard/danger-card";
import { HeroCard } from "@/components/dashboard/hero-card";
import { SavingsCard } from "@/components/dashboard/savings-card";
import { VaultSplit } from "@/components/dashboard/vault-split";
import { WeekOverview } from "@/components/dashboard/week-overview";
import { getDashboard } from "@/lib/demo";

export default function Home() {
  const d = getDashboard();

  return (
    <AppShell>
      {/* Desktop greeting */}
      <div className="mb-6 hidden lg:block">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          {d.greeting}, Neco
        </h1>
        <p className="mt-1 text-sm text-body">Here&apos;s your week at a glance.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Main column */}
        <div className="flex flex-col gap-4 lg:col-span-2 lg:gap-6">
          <HeroCard d={d} />
          <VaultSplit d={d} />
          <WeekOverview d={d} />
          <DangerCard d={d} />
          <BillsCard d={d} />
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4 lg:gap-6">
          <SavingsCard d={d} />
          <ActivityCard d={d} />
        </div>
      </div>

      <p className="mt-6 px-1 text-center text-xs text-mute">
        Weekli tracks and plans your money — it never holds or moves funds.
      </p>
    </AppShell>
  );
}
