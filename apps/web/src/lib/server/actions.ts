"use server";

/**
 * Server actions callable from client components (store.tsx). Every action
 * sources the acting user's id from Clerk's own server-side session — never
 * from a client-supplied argument — so one signed-in user can never read or
 * write another's data even if a caller tried to pass a different id.
 */

import { auth } from "@clerk/nextjs/server";
import type { RecurrenceFrequency } from "@neco/core";
import * as repo from "./repo.ts";
import type { AppState, Category, OnboardingSetupData, Settings } from "../types.ts";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");
  return userId;
}

export async function fetchUserStateAction(): Promise<AppState> {
  const userId = await requireUserId();
  return repo.loadAppState(userId);
}

export async function persistOnboardingAction(data: OnboardingSetupData): Promise<void> {
  const userId = await requireUserId();
  await repo.persistOnboarding(userId, data);
}

export async function persistBillAction(input: {
  title: string;
  monthlyAmountMajor: number;
  frequency: RecurrenceFrequency;
  dueDayOfMonth: number;
}): Promise<void> {
  const userId = await requireUserId();
  await repo.persistBill(userId, input);
}

export async function persistExpenseAction(input: {
  title: string;
  category: Category;
  amountMajor: number;
  dayIndex: number;
  isEssential?: boolean;
}): Promise<void> {
  const userId = await requireUserId();
  await repo.persistExpense(userId, input);
}

export async function persistMoneyAction(amountMajor: number): Promise<void> {
  const userId = await requireUserId();
  await repo.persistMoney(userId, amountMajor);
}

export async function persistSettingsAction(partial: Partial<Settings>): Promise<void> {
  const userId = await requireUserId();
  await repo.persistSettings(userId, partial);
}
