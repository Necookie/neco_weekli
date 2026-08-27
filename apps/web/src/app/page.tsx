"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ActivityCard } from "@/components/dashboard/activity-card";
import { BillsCard } from "@/components/dashboard/bills-card";
import { DangerCard } from "@/components/dashboard/danger-card";
import { HeroCard } from "@/components/dashboard/hero-card";
import { SavingsCard } from "@/components/dashboard/savings-card";
import { VaultSplit } from "@/components/dashboard/vault-split";
import { WeekOverview } from "@/components/dashboard/week-overview";
import { useAppStore } from "@/lib/store";

export default function Home() {
  const { user: clerkUser } = useUser();
  const { state, user, dashboard: d } = useAppStore();

  const userName = clerkUser?.firstName || clerkUser?.fullName || user?.name || "Neco";

  return (
    <>
      {/* Desktop greeting */}
      <div className="mb-6 hidden lg:block">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          {d.greeting}, {userName}
        </h1>
        <p className="mt-1 text-sm text-body">Here&apos;s your week at a glance.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Main column */}
        <div className="flex flex-col gap-4 lg:col-span-2 lg:gap-6">
          {!state.settings.hasCompletedOnboarding && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary-pale/60 p-4 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-primary text-ink-deep font-bold">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <p className="font-bold text-ink-deep">Personalize Your Weekli Plan</p>
                  <p className="text-body">
                    Calibrate your income, subscriptions, and runway in 60 seconds.
                  </p>
                </div>
              </div>
              <Link
                href="/onboarding"
                className="rounded-xl bg-ink px-4 py-2 font-display text-xs font-bold text-primary transition hover:bg-black/90 active:scale-[0.98]"
              >
                Start Calibration →
              </Link>
            </div>
          )}

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
    </>
  );
}
