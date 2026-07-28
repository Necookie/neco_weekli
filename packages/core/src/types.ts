/** Shared domain types (mirror the DB schema in ./db/schema.ts). */

export type Vault = "BILLS_RESERVE" | "SAVINGS" | "SAFE_TO_SPEND";

export type LedgerType =
  | "INCOME_SPLIT"
  | "EXPENSE"
  | "BILL_PAID"
  | "ROLLOVER"
  | "ADJUSTMENT";

export type IncomeType = "FIXED" | "VARIABLE";

export interface LedgerEntry {
  entryId: string;
  userId: string;
  type: LedgerType;
  vault: Vault;
  /** Signed minor units: +credit into the vault, -debit out of it. */
  amount: number;
  occurredAt: string;
  /** Idempotency key for offline-safe sync. */
  clientGeneratedId: string;
}
