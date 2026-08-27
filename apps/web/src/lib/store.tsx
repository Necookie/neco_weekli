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
import {
  checkRateLimit,
  clearFailedAttempts,
  getActiveSession,
  getRegisteredUsers,
  hashPassword,
  recordFailedAttempt,
  saveRegisteredUsers,
  setActiveSession,
  validateEmail,
  validatePassword,
  type StoredUserAccount,
  type UserProfile,
} from "./auth";
import { computeDashboard, type Dashboard } from "./dashboard.ts";
import { DEFAULT_STATE, DEFAULT_TARGET_SLIDERS } from "./seed.ts";
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
  user: UserProfile | null;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const hydrated = useRef(false);
  const [isLogExpenseOpen, setLogExpenseOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage on mount (client-only).
  useEffect(() => {
    setState(loadInitial());
    setUser(getActiveSession());
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

  // ─── Auth methods with security guardrails ──────────────────────────────────

  const signIn = useCallback(
    async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      const cleanEmail = email.trim().toLowerCase();
      if (!validateEmail(cleanEmail)) {
        return { success: false, error: "Please provide a valid email address." };
      }

      // Check rate limit
      const rate = checkRateLimit(cleanEmail);
      if (!rate.allowed) {
        return {
          success: false,
          error: `Too many failed attempts. Please wait ${rate.waitSeconds}s.`,
        };
      }

      const users = getRegisteredUsers();
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!existing) {
        recordFailedAttempt(cleanEmail);
        return { success: false, error: "No account found with this email." };
      }

      const hashed = await hashPassword(pass);
      if (existing.passwordHash !== hashed) {
        recordFailedAttempt(cleanEmail);
        return { success: false, error: "Incorrect password." };
      }

      clearFailedAttempts(cleanEmail);
      const sessionUser: UserProfile = {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        createdAt: existing.createdAt,
      };
      setUser(sessionUser);
      setActiveSession(sessionUser);
      notify(`Welcome back, ${existing.name}!`);
      return { success: true };
    },
    [notify],
  );

  const signUp = useCallback(
    async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanName) {
        return { success: false, error: "Please enter your name." };
      }
      if (!validateEmail(cleanEmail)) {
        return { success: false, error: "Please provide a valid email address." };
      }

      const passCheck = validatePassword(pass);
      if (!passCheck.valid) {
        return { success: false, error: passCheck.message };
      }

      const users = getRegisteredUsers();
      const duplicate = users.some((u) => u.email.toLowerCase() === cleanEmail);
      if (duplicate) {
        return { success: false, error: "An account with this email already exists." };
      }

      const hashed = await hashPassword(pass);
      const newAccount: StoredUserAccount = {
        id: `u_${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        passwordHash: hashed,
        createdAt: new Date().toISOString(),
      };

      saveRegisteredUsers([...users, newAccount]);

      const sessionUser: UserProfile = {
        id: newAccount.id,
        name: newAccount.name,
        email: newAccount.email,
        createdAt: newAccount.createdAt,
      };
      setUser(sessionUser);
      setActiveSession(sessionUser);
      notify(`Account created! Welcome, ${cleanName}.`);
      return { success: true };
    },
    [notify],
  );

  const signOut = useCallback(() => {
    setUser(null);
    setActiveSession(null);
    notify("Signed out");
  }, [notify]);

  // ─── Financial Engine actions ───────────────────────────────────────────────

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
    },
    [state.settings, notify],
  );

  const loadDemoData = useCallback(() => {
    setState(DEFAULT_STATE);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
    }
    notify("Loaded sample demo dataset");
  }, [notify]);

  const resetDemo = useCallback(() => {
    setState({
      ...DEFAULT_STATE,
      expenses: [],
      bills: [],
      accruals: [],
      contributions: [],
      settings: {
        ...DEFAULT_STATE.settings,
        hasCompletedOnboarding: false,
      },
    });
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    notify("Reset all data to empty state");
  }, [notify]);

  const value: Ctx = {
    state,
    dashboard,
    user,
    isAuthModalOpen,
    openAuthModal: () => setAuthModalOpen(true),
    closeAuthModal: () => setAuthModalOpen(false),
    signIn,
    signUp,
    signOut,
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
