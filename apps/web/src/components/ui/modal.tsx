"use client";

import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm lg:items-center lg:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-t-2xl bg-canvas p-5 lg:rounded-2xl lg:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="font-display text-lg font-extrabold text-ink">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-mute transition hover:bg-canvas-soft"
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const modalInputCls =
  "w-full rounded-md border border-ink bg-canvas px-4 py-3 text-sm text-ink outline-none transition focus:ring-2 focus:ring-primary/50";
