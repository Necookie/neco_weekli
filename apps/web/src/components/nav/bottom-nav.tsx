"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, type NavItem, NAV } from "@/lib/nav";
import { FabLogExpenseButton } from "./log-expense-button";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-black/5 bg-canvas/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
      {NAV.slice(0, 2).map((item) => (
        <BottomLink key={item.href} item={item} active={isActive(item.href, pathname)} />
      ))}

      <FabLogExpenseButton />

      {NAV.slice(2, 5).map((item) => (
        <BottomLink key={item.href} item={item} active={isActive(item.href, pathname)} />
      ))}
    </nav>
  );
}

function BottomLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-semibold ${
        active ? "text-ink" : "text-mute"
      }`}
    >
      <item.icon className="size-5" strokeWidth={2} />
      {item.label}
    </Link>
  );
}
