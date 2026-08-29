"use client";

import {
  FREQUENCY_LABEL,
  normalizeToWeekly,
  toMinor,
  type RecurrenceFrequency,
} from "@neco/core";
import { useState } from "react";
import { Modal, modalInputCls } from "@/components/ui";
import { useAppStore } from "@/lib/store";

const FREQUENCIES: RecurrenceFrequency[] = [
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "ANNUALLY",
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

export function AddBillModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addBill, dashboard: d, state } = useAppStore();
  const currencySymbol = CURRENCY_SYMBOLS[state.settings.currency] ?? state.settings.currency;
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("MONTHLY");
  const [dueDay, setDueDay] = useState("1");

  function reset() {
    setTitle("");
    setAmount("");
    setFrequency("MONTHLY");
    setDueDay("1");
  }

  const amountMajor = Number(amount);
  const normalizedWeeklyMinor =
    Number.isFinite(amountMajor) && amountMajor > 0
      ? normalizeToWeekly(toMinor(amountMajor), frequency)
      : 0;

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
    addBill({
      title: title.trim(),
      monthlyAmountMajor,
      frequency,
      dueDayOfMonth,
    });
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
      title="Add recurring bill"
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
            placeholder="e.g. Gym Membership"
            className={modalInputCls}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
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
            <span className="mb-1.5 block text-sm font-semibold text-ink">Cadence</span>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
              className={modalInputCls}
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABEL[f]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Live Normalized Weekly Impact Preview */}
        {normalizedWeeklyMinor > 0 && (
          <div className="rounded-xl bg-canvas-soft p-3 text-xs text-body">
            <span className="font-semibold text-ink">Normalized Accrual Burn: </span>
            <strong className="text-ink-deep">{d.fmt(normalizedWeeklyMinor)}</strong> / week
            <span className="ml-1 text-mute">
              ({frequency === "MONTHLY" ? "sunk across 4.33 wks" : "standardized for runway"})
            </span>
          </div>
        )}

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
          Add recurring bill
        </button>
      </form>
    </Modal>
  );
}
