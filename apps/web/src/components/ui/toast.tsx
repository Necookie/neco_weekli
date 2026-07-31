"use client";

import { useAppStore } from "@/lib/store";

export function Toast() {
  const { toast } = useAppStore();
  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-6">
      <div className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
        {toast}
      </div>
    </div>
  );
}
