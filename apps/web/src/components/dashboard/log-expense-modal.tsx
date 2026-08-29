"use client";

import { useEffect, useState } from "react";
import { getShortDayLabelsForStart, weekdayIndexFrom } from "@neco/core";
import { Modal, modalInputCls } from "@/components/ui";
import { CATEGORIES, ESSENTIAL_CATEGORIES, type Category } from "@/lib/types";
import { useAppStore } from "@/lib/store";

const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

export function LogExpenseModal() {
  const { isLogExpenseOpen, closeLogExpense, addExpense, state } = useAppStore();
  const weekStart = state.settings.weekStart;
  const currencySymbol = CURRENCY_SYMBOLS[state.settings.currency] ?? state.settings.currency;
  const dayLabels = getShortDayLabelsForStart(weekStart);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]!);
  const [isEssential, setIsEssential] = useState(
    ESSENTIAL_CATEGORIES.has(CATEGORIES[0]!),
  );
  const [amount, setAmount] = useState("");
  const [dayIndex, setDayIndex] = useState(weekdayIndexFrom(new Date(), weekStart));

  // Keep dayIndex synced with weekStart when modal opens
  useEffect(() => {
    if (isLogExpenseOpen) {
      setDayIndex(weekdayIndexFrom(new Date(), weekStart));
    }
  }, [isLogExpenseOpen, weekStart]);

  function reset() {
    setTitle("");
    setCategory(CATEGORIES[0]!);
    setIsEssential(ESSENTIAL_CATEGORIES.has(CATEGORIES[0]!));
    setAmount("");
  }

  function handleCategoryChange(newCat: Category) {
    setCategory(newCat);
    setIsEssential(ESSENTIAL_CATEGORIES.has(newCat));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountMajor = Number(amount);
    if (!title.trim() || !Number.isFinite(amountMajor) || amountMajor <= 0) return;
    addExpense({
      title: title.trim(),
      category,
      amountMajor,
      dayIndex,
      isEssential,
    });
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
              {currencySymbol}
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
            onChange={(e) => handleCategoryChange(e.target.value as Category)}
            className={modalInputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center justify-between gap-3 rounded-md border border-ink/10 bg-canvas-soft/50 px-3.5 py-2.5">
          <div className="text-xs">
            <span className="font-semibold text-ink">Essential survival expense</span>
            <p className="text-[11px] text-mute">Counts toward baseline burn for runway.</p>
          </div>
          <input
            type="checkbox"
            checked={isEssential}
            onChange={(e) => setIsEssential(e.target.checked)}
            className="size-4 accent-primary"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">Day</span>
          <select
            value={dayIndex}
            onChange={(e) => setDayIndex(Number(e.target.value))}
            className={modalInputCls}
          >
            {dayLabels.map((day, i) => (
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
