import {
  Compass,
  LayoutDashboard,
  ListChecks,
  PiggyBank,
  Receipt,
  Settings,
} from "lucide-react";
import type { ComponentType } from "react";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
};

export const NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Runway", href: "/runway", icon: Compass },
  { label: "Bills", href: "/bills", icon: Receipt },
  { label: "Savings", href: "/savings", icon: PiggyBank },
  { label: "Activity", href: "/activity", icon: ListChecks },
  { label: "Settings", href: "/settings", icon: Settings },
];

/** True when `href` is the active route for `pathname`. */
export function isActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
