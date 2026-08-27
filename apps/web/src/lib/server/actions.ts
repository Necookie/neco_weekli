"use server";

/**
 * Server actions callable from client components (store.tsx). Every action
 * sources the acting user's id from Clerk's own server-side session — never
 * from a client-supplied argument — so one signed-in user can never read or
 * write another's data even if a caller tried to pass a different id.
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
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

/**
 * Permanently deletes the signed-in user's account: every Turso row they
 * own, then the Clerk user itself. This is the in-app "Delete Account"
 * path — deleting straight from Clerk's own account portal instead skips
 * this action entirely, which is why the `user.deleted` webhook
 * (app/api/webhooks/clerk/route.ts) does the same Turso cleanup from the
 * other direction.
 */
export async function deleteAccountAction(): Promise<void> {
  const userId = await requireUserId();
  await repo.deleteUser(userId);
  const client = await clerkClient();
  await client.users.deleteUser(userId);
}
