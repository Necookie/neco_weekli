"use client";

import { useState } from "react";
import { modalInputCls, Modal } from "@/components/ui/modal";
import { useAppStore } from "@/lib/store";

export function AddMoneyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addMoney } = useAppStore();
  const [amount, setAmount] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountMajor = Number(amount);
    if (!Number.isFinite(amountMajor) || amountMajor <= 0) return;
    addMoney(amountMajor);
    setAmount("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        setAmount("");
        onClose();
      }}
      title="Add money"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Amount</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-mute">
              ₱
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`${modalInputCls} pl-8`}
            />
          </div>
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-6 py-3 text-center font-display text-sm font-extrabold text-on-primary transition active:scale-[0.99]"
        >
          Add to savings
        </button>
      </form>
    </Modal>
  );
}
