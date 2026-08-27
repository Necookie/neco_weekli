import { Show, SignInButton, UserButton } from "@clerk/nextjs";
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

          <Show when="signed-in">
            <div className="flex items-center gap-2.5 rounded-xl border border-black/5 bg-canvas-soft/60 p-2">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "size-8",
                  },
                }}
              />
              <div className="min-w-0 text-xs leading-tight">
                <p className="truncate font-semibold text-ink">Account</p>
                <p className="text-[11px] text-mute">Synced with Clerk</p>
              </div>
            </div>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-black/90 active:scale-[0.98]"
              >
                Sign in / Register
              </button>
            </SignInButton>
          </Show>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between px-4 py-3 lg:hidden">
          <Wordmark />
          <div className="flex items-center gap-2">
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "size-8",
                  },
                }}
              />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-primary"
                >
                  Sign in
                </button>
              </SignInButton>
            </Show>
          </div>
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
