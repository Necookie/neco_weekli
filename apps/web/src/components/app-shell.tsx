import {
  LayoutDashboard,
  ListChecks,
  PiggyBank,
  Plus,
  Receipt,
  Settings,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  href: string;
  active?: boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "#", active: true },
  { label: "Bills", icon: Receipt, href: "#" },
  { label: "Savings", icon: PiggyBank, href: "#" },
  { label: "Activity", icon: ListChecks, href: "#" },
  { label: "Settings", icon: Settings, href: "#" },
];

function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-8 text-lg" : "size-7 text-base";
  const text = size === "lg" ? "text-xl" : "text-lg";
  return (
    <div className="flex items-center gap-2">
      <span
        className={`grid ${box} place-items-center rounded-lg bg-primary font-display font-extrabold text-on-primary`}
      >
        w
      </span>
      <span className={`font-display ${text} font-extrabold tracking-tight`}>
        weekli
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col justify-between border-r border-black/5 bg-canvas px-4 py-6 lg:flex">
        <div>
          <div className="mb-8 px-2">
            <Wordmark size="lg" />
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  item.active
                    ? "bg-primary-pale text-ink-deep"
                    : "text-body hover:bg-canvas-soft"
                }`}
              >
                {item.active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <item.icon className="size-5" strokeWidth={2} />
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-sm font-extrabold text-on-primary transition active:scale-[0.99]"
          >
            <Plus className="size-4" strokeWidth={3} />
            Log expense
          </button>
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
          <span className="grid size-9 place-items-center rounded-full bg-ink text-sm font-semibold text-primary">
            N
          </span>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-black/5 bg-canvas/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
        {NAV.slice(0, 2).map((item) => (
          <BottomLink key={item.label} item={item} />
        ))}
        <button
          type="button"
          aria-label="Log expense"
          className="-mt-6 grid size-14 shrink-0 place-items-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/40 transition active:scale-95"
        >
          <Plus className="size-6" strokeWidth={3} />
        </button>
        {NAV.slice(2, 4).map((item) => (
          <BottomLink key={item.label} item={item} />
        ))}
      </nav>
    </div>
  );
}

function BottomLink({ item }: { item: NavItem }) {
  return (
    <a
      href={item.href}
      aria-current={item.active ? "page" : undefined}
      className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-semibold ${
        item.active ? "text-ink" : "text-mute"
      }`}
    >
      <item.icon className="size-5" strokeWidth={2} />
      {item.label}
    </a>
  );
}
