"use client";

import { type Bill, type RecurrenceFrequency, toMinor } from "@neco/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { computeDashboard, type Dashboard } from "./dashboard.ts";
import { DEFAULT_STATE, DEFAULT_TARGET_SLIDERS } from "./seed.ts";
import { loadInitial, nextId, STORAGE_KEY } from "./storage.ts";
import type { AppState, Category, Settings, TargetSliders } from "./types.ts";

// ─── Input types ─────────────────────────────────────────────────────────────

type AddExpenseInput = {
  title: string;
  category: Category;
  amountMajor: number;
  dayIndex: number;
  isEssential?: boolean;
};

type AddBillInput = {
  title: string;
  monthlyAmountMajor: number;
  dueDayOfMonth: number;
  frequency?: RecurrenceFrequency;
};

// ─── Context shape ────────────────────────────────────────────────────────────

type Ctx = {
  state: AppState;
  dashboard: Dashboard;
  addExpense: (input: AddExpenseInput) => void;
  addBill: (input: AddBillInput) => void;
  addMoney: (amountMajor: number) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  updateTargetSliders: (partial: Partial<TargetSliders>) => void;
  resetTargetSliders: () => void;
  resetDemo: () => void;
  isLogExpenseOpen: boolean;
  openLogExpense: () => void;
  closeLogExpense: () => void;
  toast: string | null;
  notify: (message: string) => void;
};


const AppDataContext = createContext<Ctx | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const hydrated = useRef(false);
  const [isLogExpenseOpen, setLogExpenseOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage on mount (client-only).
  useEffect(() => {
    setState(loadInitial());
    hydrated.current = true;
  }, []);

  // Debounced localStorage persistence (300 ms after last state change).
  useEffect(() => {
    if (!hydrated.current) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 300);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [state]);

  // Cleanup toast timer on unmount.
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const dashboard = useMemo(() => computeDashboard(state), [state]);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const addExpense = useCallback(
    ({ title, category, amountMajor, dayIndex, isEssential }: AddExpenseInput) => {
      setState((s) => ({
        ...s,
        expenses: [
          ...s.expenses,
          { id: nextId("e"), title, category, amountMajor, dayIndex, isEssential },
        ],
      }));
      notify(`Logged ${title}`);
    },
    [notify],
  );

  const addBill = useCallback(
    ({ title, monthlyAmountMajor, dueDayOfMonth, frequency = "MONTHLY" }: AddBillInput) => {
      const id = nextId("b");
      const bill: Bill = {
        id,
        title,
        monthlyAmount: toMinor(monthlyAmountMajor),
        frequency,
        dueDayOfMonth,
      };
      setState((s) => ({
        ...s,
        bills: [...s.bills, bill],
        accruals: [...s.accruals, { billId: id, accrued: 0 }],
      }));
      notify(`Added ${title}`);
    },
    [notify],
  );

  const addMoney = useCallback(
    (amountMajor: number) => {
      setState((s) => ({
        ...s,
        savings: {
          ...s.savings,
          balanceMinor: s.savings.balanceMinor + toMinor(amountMajor),
        },
        contributions: [
          { id: nextId("c"), label: "Manual top-up", when: "Just now", amountMinor: toMinor(amountMajor) },
          ...s.contributions,
        ],
      }));
      notify(`Added ₱${amountMajor.toLocaleString("en-PH")} to savings`);
    },
    [notify],
  );

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...partial } }));
  }, []);

  const updateTargetSliders = useCallback((partial: Partial<TargetSliders>) => {
    setState((s) => ({
      ...s,
      targetSliders: { ...s.targetSliders, ...partial },
    }));
  }, []);

  const resetTargetSliders = useCallback(() => {
    setState((s) => ({
      ...s,
      targetSliders: DEFAULT_TARGET_SLIDERS,
    }));
    notify("Reset spending targets to defaults");
  }, [notify]);

  const resetDemo = useCallback(() => {
    setState(DEFAULT_STATE);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    notify("Signed out — local demo data reset");
  }, [notify]);

  const value: Ctx = {
    state,
    dashboard,
    addExpense,
    addBill,
    addMoney,
    updateSettings,
    updateTargetSliders,
    resetTargetSliders,
    resetDemo,
    isLogExpenseOpen,
    openLogExpense: () => setLogExpenseOpen(true),
    closeLogExpense: () => setLogExpenseOpen(false),
    toast,
    notify,
  };


  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

/** Returns the app data context. Must be called inside an {@link AppDataProvider}. */
export function useAppStore(): Ctx {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppStore must be used within AppDataProvider");
  return ctx;
}
