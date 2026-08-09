"use client";

import { useState } from "react";
import { DAY_LABEL_SHORT } from "@neco/core";
import { modalInputCls, Modal } from "@/components/ui/modal";
import { CATEGORIES, type Category } from "@/lib/types";
import { useAppStore } from "@/lib/store";

export function LogExpenseModal() {
  const { isLogExpenseOpen, closeLogExpense, addExpense } = useAppStore();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]!);
  const [amount, setAmount] = useState("");
  const [dayIndex, setDayIndex] = useState((new Date().getDay() + 6) % 7);

  function reset() {
    setTitle("");
    setCategory(CATEGORIES[0]!);
    setAmount("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountMajor = Number(amount);
    if (!title.trim() || !Number.isFinite(amountMajor) || amountMajor <= 0) return;
    addExpense({ title: title.trim(), category, amountMajor, dayIndex });
    reset();
    closeLogExpense();
  }

  return (
    <Modal
      open={isLogExpenseOpen}
      onClose={() => {
        reset();
        closeLogExpense();
      }}
      title="Log expense"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">What was it?</span>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lunch"
            className={modalInputCls}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Amount</span>
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
          <span className="mb-1.5 block text-sm font-semibold text-ink">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className={modalInputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Day</span>
          <select
            value={dayIndex}
            onChange={(e) => setDayIndex(Number(e.target.value))}
            className={modalInputCls}
          >
            {DAY_LABEL_SHORT.map((day, i) => (
              <option key={day} value={i}>
                {day}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-6 py-3 text-center font-display text-sm font-extrabold text-on-primary transition active:scale-[0.99]"
        >
          Add expense
        </button>
      </form>
    </Modal>
  );
}
