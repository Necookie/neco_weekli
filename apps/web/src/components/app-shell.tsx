import Link from "next/link";
import type { ReactNode } from "react";
import { LogExpenseModal } from "@/components/dashboard/log-expense-modal";
import { BottomNav } from "@/components/nav/bottom-nav";
import { SidebarLogExpenseButton } from "@/components/nav/log-expense-button";
import { SidebarNav } from "@/components/nav/sidebar-nav";
import { Toast } from "@/components/ui/toast";
import { Wordmark } from "@/components/ui/wordmark";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col justify-between border-r border-black/5 bg-canvas px-4 py-6 lg:flex">
        <div>
          <div className="mb-8 px-2">
            <Wordmark size="lg" />
          </div>
          <SidebarNav />
        </div>

        <div className="flex flex-col gap-4">
          <SidebarLogExpenseButton />
          <div className="flex items-center gap-2 px-1">
            <span className="grid size-8 place-items-center rounded-full bg-ink text-xs font-semibold text-primary">
              N
            </span>
            <div className="text-xs leading-tight">
              <p className="font-semibold text-ink">Neco</p>
              <p className="text-mute">Weekly plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between px-4 py-3 lg:hidden">
          <Wordmark />
          <Link
            href="/settings"
            aria-label="Settings"
            className="grid size-9 place-items-center rounded-full bg-ink text-sm font-semibold text-primary"
          >
            N
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <BottomNav />
      <Toast />
      <LogExpenseModal />
    </div>
  );
}
