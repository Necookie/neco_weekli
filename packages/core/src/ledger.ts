/**
 * The ledger is append-only; vault balances are DERIVED, never stored. This is
 * what makes offline sync conflict-free (SRS §3.4, §4).
 */

import type { LedgerEntry, Vault } from "./types.ts";

export type VaultBalances = Record<Vault, number>;

export function emptyBalances(): VaultBalances {
  return { BILLS_RESERVE: 0, SAVINGS: 0, SAFE_TO_SPEND: 0 };
}

/** Fold every entry into per-vault balances. */
export function foldLedger(entries: LedgerEntry[]): VaultBalances {
  const balances = emptyBalances();
  for (const e of entries) {
    balances[e.vault] += e.amount;
  }
  return balances;
}

/** Balance of a single vault. */
export function vaultBalance(entries: LedgerEntry[], vault: Vault): number {
  return entries.reduce(
    (sum, e) => (e.vault === vault ? sum + e.amount : sum),
    0,
  );
}
