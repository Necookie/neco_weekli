import assert from "node:assert/strict";
import { test } from "node:test";
import { foldLedger, vaultBalance } from "./ledger.ts";
import type { LedgerEntry } from "./types.ts";

const entry = (
  partial: Pick<LedgerEntry, "type" | "vault" | "amount">,
  i: number,
): LedgerEntry => ({
  entryId: `e${i}`,
  userId: "u1",
  occurredAt: "2026-07-28T00:00:00Z",
  clientGeneratedId: `c${i}`,
  ...partial,
});

test("foldLedger derives balances from an append-only log", () => {
  const entries: LedgerEntry[] = [
    entry({ type: "INCOME_SPLIT", vault: "BILLS_RESERVE", amount: 5_000 }, 1),
    entry({ type: "INCOME_SPLIT", vault: "SAVINGS", amount: 3_000 }, 2),
    entry({ type: "INCOME_SPLIT", vault: "SAFE_TO_SPEND", amount: 7_000 }, 3),
    entry({ type: "EXPENSE", vault: "SAFE_TO_SPEND", amount: -2_500 }, 4),
    entry({ type: "BILL_PAID", vault: "BILLS_RESERVE", amount: -5_000 }, 5),
  ];

  const balances = foldLedger(entries);
  assert.equal(balances.BILLS_RESERVE, 0);
  assert.equal(balances.SAVINGS, 3_000);
  assert.equal(balances.SAFE_TO_SPEND, 4_500);
});

test("vaultBalance sums a single vault", () => {
  const entries: LedgerEntry[] = [
    entry({ type: "INCOME_SPLIT", vault: "SAVINGS", amount: 3_000 }, 1),
    entry({ type: "ROLLOVER", vault: "SAVINGS", amount: 1_800 }, 2),
    entry({ type: "EXPENSE", vault: "SAFE_TO_SPEND", amount: -500 }, 3),
  ];
  assert.equal(vaultBalance(entries, "SAVINGS"), 4_800);
  assert.equal(vaultBalance(entries, "BILLS_RESERVE"), 0);
});
