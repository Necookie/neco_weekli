/**
 * LocalStorage persistence utilities for the app state.
 *
 * Separated from the React context/store so the serialisation logic can be
 * tested without a DOM and imported without pulling in React.
 */

import { CLEAN_INITIAL_STATE, DEFAULT_STATE } from "./seed.ts";
import type { AppState } from "./types.ts";

/** localStorage key for the persisted app state. */
export const STORAGE_KEY = "weekli:state:v1";

/**
 * Reads and deserialises app state from localStorage, returning
 * {@link CLEAN_INITIAL_STATE} if nothing is stored, deserialisation fails,
 * or the user has not completed onboarding yet.
 *
 * Also prunes stale accruals whose `billId` no longer has a matching bill —
 * these accumulate when bills are deleted and would grow without bound.
 */
export function loadInitial(): AppState {
  if (typeof window === "undefined") return CLEAN_INITIAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return CLEAN_INITIAL_STATE;
    const parsed = JSON.parse(raw) as AppState;

    // If onboarding has not been completed, enforce clean initial state with zero mock expenses
    if (!parsed.settings || parsed.settings.hasCompletedOnboarding !== true) {
      return CLEAN_INITIAL_STATE;
    }

    const merged: AppState = {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
      targetSliders: {
        ...DEFAULT_STATE.targetSliders,
        ...(parsed.targetSliders ?? {}),
      },
    };

    // Prune accruals whose billId has no corresponding bill
    const billIds = new Set(merged.bills.map((b) => b.id));
    merged.accruals = merged.accruals.filter((a) => billIds.has(a.billId));
    return merged;
  } catch {
    return CLEAN_INITIAL_STATE;
  }
}

// ─── Monotonic ID generator ───────────────────────────────────────────────────

let _bumpId = 0;

/**
 * Generates a monotonically increasing ID with a user-supplied prefix.
 * Safe to call multiple times within the same millisecond — the `_bumpId`
 * counter ensures uniqueness.
 *
 * @example nextId("e") → "e17200000001"
 */
export function nextId(prefix: string): string {
  _bumpId += 1;
  return `${prefix}${Date.now()}${_bumpId}`;
}
