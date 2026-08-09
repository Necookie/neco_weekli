"use client";

import { useState } from "react";
import { Modal, modalInputCls } from "@/components/ui";
import { useAppStore } from "@/lib/store";

export function AddBillModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addBill } = useAppStore();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");

  function reset() {
    setTitle("");
    setAmount("");
    setDueDay("1");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const monthlyAmountMajor = Number(amount);
    const dueDayOfMonth = Number(dueDay);
    if (
      !title.trim() ||
      !Number.isFinite(monthlyAmountMajor) ||
      monthlyAmountMajor <= 0 ||
      !Number.isInteger(dueDayOfMonth) ||
      dueDayOfMonth < 1 ||
      dueDayOfMonth > 31
    ) {
      return;
    }
    addBill({ title: title.trim(), monthlyAmountMajor, dueDayOfMonth });
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add bill"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Name</span>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Netflix"
            className={modalInputCls}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Monthly amount</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-mute">
              ₱
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`${modalInputCls} pl-8`}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Due day of month</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max="31"
            step="1"
            required
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            className={modalInputCls}
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-6 py-3 text-center font-display text-sm font-extrabold text-on-primary transition active:scale-[0.99]"
        >
          Add bill
        </button>
      </form>
    </Modal>
  );
}
