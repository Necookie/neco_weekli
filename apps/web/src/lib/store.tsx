"use client";

import { useUser } from "@clerk/nextjs";
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
import { CLEAN_INITIAL_STATE, DEFAULT_STATE, DEFAULT_TARGET_SLIDERS, DEMO_PLAYGROUND_STATE } from "./seed.ts";
import {
  fetchUserStateAction,
  persistBillAction,
  persistExpenseAction,
  persistMoneyAction,
  persistOnboardingAction,
  persistSettingsAction,
} from "./server/actions.ts";
import { loadInitial, nextId, STORAGE_KEY } from "./storage.ts";
import type {
  AppState,
  Category,
  OnboardingSetupData,
  Settings,
  TargetSliders,
} from "./types.ts";

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
  applyOnboardingSetup: (data: OnboardingSetupData) => void;
  loadDemoData: () => void;
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
  const { isLoaded, isSignedIn } = useUser();

  // Hydrate on mount / whenever sign-in state resolves. Signed-in users are
  // backed by Turso (source of truth); localStorage is only the last-known
  // cache we fall back to if the server fetch fails (offline, DB hiccup) —
  // every route requires auth (middleware.ts), so the signed-out branch only
  // matters for the brief window before Clerk finishes loading.
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;

    if (isSignedIn) {
      fetchUserStateAction()
        .then((s) => {
          if (!cancelled) setState(s);
        })
        .catch((err) => {
          console.error("Failed to load account data, using local cache:", err);
          if (!cancelled) setState(loadInitial());
        })
        .finally(() => {
          if (!cancelled) hydrated.current = true;
        });
    } else {
      setState(loadInitial());
      hydrated.current = true;
    }

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  // Debounced localStorage persistence (300 ms after last state change) —
  // acts as the offline-read cache described above.
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

  // ─── Financial Engine actions ───────────────────────────────────────────────

  // Fire a persistence call for a signed-in user without blocking the
  // (already-applied) optimistic UI update; surface failures via a toast
  // rather than throwing, since the change is already visible locally.
  const persistInBackground = useCallback(
    (label: string, run: () => Promise<void>) => {
      if (!isSignedIn) return;
      run().catch((err) => {
        console.error(`Failed to save ${label}:`, err);
        notify(`Saved locally, but couldn't sync ${label} to your account.`);
      });
    },
    [isSignedIn, notify],
  );

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
      persistInBackground("that expense", () =>
        persistExpenseAction({ title, category, amountMajor, dayIndex, isEssential }),
      );
    },
    [notify, persistInBackground],
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
      persistInBackground("that bill", () =>
        persistBillAction({ title, monthlyAmountMajor, dueDayOfMonth, frequency }),
      );
    },
    [notify, persistInBackground],
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
      persistInBackground("that deposit", () => persistMoneyAction(amountMajor));
    },
    [notify, persistInBackground],
  );

  const updateSettings = useCallback(
    (partial: Partial<Settings>) => {
      setState((s) => ({ ...s, settings: { ...s.settings, ...partial } }));
      persistInBackground("your settings", () => persistSettingsAction(partial));
    },
    [persistInBackground],
  );

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

  // Apply complete personalized onboarding setup
  const applyOnboardingSetup = useCallback(
    (data: OnboardingSetupData) => {
      const newBills: Bill[] = data.bills.map((b) => ({
        id: b.id,
        title: b.title,
        monthlyAmount: toMinor(b.amountMajor),
        frequency: b.frequency,
        dueDayOfMonth: b.dueDayOfMonth,
      }));

      const newAccruals = newBills.map((b) => ({
        billId: b.id,
        accrued: 0,
      }));

      const newState: AppState = {
        settings: {
          ...state.settings,
          income: toMinor(data.incomeWeeklyMajor),
          savingsPct: data.savingsPct,
          payday: data.payday,
          hasCompletedOnboarding: true,
        },
        bills: newBills,
        accruals: newAccruals,
        expenses: [], // Clean slate: clear all old mock placeholder transactions!
        savings: {
          balanceMinor: toMinor(data.liquidSavingsMajor ?? 5000),
          goalMinor: toMinor(data.savingsGoalMajor ?? 30000),
          label: "Emergency & Runway Fund",
          isLiquid: true,
        },
        contributions: [
          {
            id: nextId("c"),
            label: "Initial runway pool",
            when: "Today",
            amountMinor: toMinor(data.liquidSavingsMajor ?? 5000),
          },
        ],
        targetSliders: data.sliders,
      };

      setState(newState);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      }
      notify("Plan applied successfully! Ready for your week.");
      persistInBackground("your plan", () => persistOnboardingAction(data));
    },
    [state.settings, notify, persistInBackground],
  );

  const loadDemoData = useCallback(() => {
    setState(DEMO_PLAYGROUND_STATE);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_PLAYGROUND_STATE));
    }
    notify("Loaded sample playground dataset");
  }, [notify]);

  const resetDemo = useCallback(() => {
    setState(CLEAN_INITIAL_STATE);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    notify("Reset all data to empty state");
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
    applyOnboardingSetup,
    loadDemoData,
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
