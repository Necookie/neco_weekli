"use client";

import { type Bill, toMinor } from "@neco/core";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type AppState,
  type Category,
  computeDashboard,
  type Dashboard,
  DEFAULT_STATE,
  type Settings,
} from "./demo";

const STORAGE_KEY = "weekli:state:v1";

type AddExpenseInput = {
  title: string;
  category: Category;
  amountMajor: number;
  dayIndex: number;
};

type AddBillInput = {
  title: string;
  monthlyAmountMajor: number;
  dueDayOfMonth: number;
};

type Ctx = {
  state: AppState;
  dashboard: Dashboard;
  addExpense: (input: AddExpenseInput) => void;
  addBill: (input: AddBillInput) => void;
  addMoney: (amountMajor: number) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  resetDemo: () => void;
  isLogExpenseOpen: boolean;
  openLogExpense: () => void;
  closeLogExpense: () => void;
  toast: string | null;
  notify: (message: string) => void;
};

const AppDataContext = createContext<Ctx | null>(null);

function loadInitial(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as AppState;
    const merged: AppState = {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
    };
    // Prune accruals whose billId has no corresponding bill — they are stale
    // references left over from deleted bills and would grow unboundedly.
    const billIds = new Set(merged.bills.map((b) => b.id));
    merged.accruals = merged.accruals.filter((a) => billIds.has(a.billId));
    return merged;
  } catch {
    return DEFAULT_STATE;
  }
}

let bumpId = 0;
/** Monotonic id, safe even when called multiple times in the same millisecond. */
function nextId(prefix: string): string {
  bumpId += 1;
  return `${prefix}${Date.now()}${bumpId}`;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const hydrated = useRef(false);
  const [isLogExpenseOpen, setLogExpenseOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setState(loadInitial());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const dashboard = useMemo(() => computeDashboard(state), [state]);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const addExpense = ({ title, category, amountMajor, dayIndex }: AddExpenseInput) => {
    setState((s) => ({
      ...s,
      expenses: [
        ...s.expenses,
        { id: nextId("e"), title, category, amountMajor, dayIndex },
      ],
    }));
    notify(`Logged ${title}`);
  };

  const addBill = ({ title, monthlyAmountMajor, dueDayOfMonth }: AddBillInput) => {
    const id = nextId("b");
    const bill: Bill = { id, title, monthlyAmount: toMinor(monthlyAmountMajor), dueDayOfMonth };
    setState((s) => ({
      ...s,
      bills: [...s.bills, bill],
      accruals: [...s.accruals, { billId: id, accrued: 0 }],
    }));
    notify(`Added ${title}`);
  };

  const addMoney = (amountMajor: number) => {
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
  };

  const updateSettings = (partial: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...partial } }));
  };

  const resetDemo = () => {
    setState(DEFAULT_STATE);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    notify("Signed out — local demo data reset");
  };

  const value: Ctx = {
    state,
    dashboard,
    addExpense,
    addBill,
    addMoney,
    updateSettings,
    resetDemo,
    isLogExpenseOpen,
    openLogExpense: () => setLogExpenseOpen(true),
    closeLogExpense: () => setLogExpenseOpen(false),
    toast,
    notify,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppStore(): Ctx {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppStore must be used within AppDataProvider");
  return ctx;
}
