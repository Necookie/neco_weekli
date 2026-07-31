"use client";

import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function SidebarLogExpenseButton() {
  const { openLogExpense } = useAppStore();
  return (
    <button
      type="button"
      onClick={openLogExpense}
      className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-sm font-extrabold text-on-primary transition active:scale-[0.99]"
    >
      <Plus className="size-4" strokeWidth={3} />
      Log expense
    </button>
  );
}

export function FabLogExpenseButton() {
  const { openLogExpense } = useAppStore();
  return (
    <button
      type="button"
      aria-label="Log expense"
      onClick={openLogExpense}
      className="-mt-6 grid size-14 shrink-0 place-items-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/40 transition active:scale-95"
    >
      <Plus className="size-6" strokeWidth={3} />
    </button>
  );
}
