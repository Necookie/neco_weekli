# WeeklyVault — Product Requirements & Software Requirements Specification

> **Status:** Draft v2 (re-planned) · **Date:** 2026-07-28
> **Codename:** WeeklyVault *(final name TBD — see [§0.1](#01-naming))*
> **Doc owner:** Product & Engineering
> **Supersedes:** WeeklyVault PRD & SRS v1

---

## 0. Preface

### 0.1 Naming
The v1 document used **WeeklyVault**. "Vault" implies the app *holds* money, which it does not (see [§1.4 Legal & Trust Framing](#14-legal--trust-framing)). Recommended shortlist, in preference order: **Cushion**, **Slice**, **Weekli**. This document uses `WeeklyVault` as a placeholder codename; a rename is a single find-replace.

### 0.2 What changed from v1
| Area | v1 | v2 |
|---|---|---|
| Reserve math | Flat `ΣMonthly / 4.33` weekly divisor | **Per-bill accrual against actual due dates** (v1's flat divisor kept only as a display estimate) |
| Data model | 3 flat entities, balances implied | **Append-only ledger**; balances *derived*, not stored |
| Income | Assumed fixed weekly allowance | **Income events** table; fixed **and** variable income supported |
| Daily cap | `(Wspend − Σexp)/(7 − daysElapsed)` → div-by-zero on day 7 | Clamped, floor-at-zero, day-7 safe formula |
| Tech stack | "Flutter **or** RN", "Supabase **or** Firebase" | **Decided:** full React — Next.js mobile-first PWA now, Expo later; **Turso** (libSQL) + Drizzle; Clerk/Better Auth; shared `packages/core` |
| Payments | "1-tap payment against reserve" | **"Mark as paid"** — tracking only, no money movement |
| Security | "AES-256 local cache" (unspecified key) | OS Keystore/Keychain-backed key + biometric gate; claim scoped honestly |

---

# PART I — PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1. Executive Summary & Vision

### 1.1 One-liner
**WeeklyVault turns a weekly paycheck into a single trustworthy number — how much you can safely spend today — while quietly setting aside every monthly bill before its due date.**

### 1.2 The problem
Mainstream budgeting apps (YNAB, EveryDollar, bank "Pots") default to a **monthly** cadence. People paid or given money **weekly** — students on allowances, gig/contract/freelance workers, hourly staff — must mentally amortize monthly bills (Netflix, Spotify, gym, mobile, rent slices) across 4–5 uneven paydays. The result is a predictable failure mode: **overspend early in the month, run short when bills land.**

### 1.3 The wedge (why this isn't "another envelope app")
Envelope budgeting and "Safe to Spend" are shipped patterns. Our defensible edge is **not** the vault mechanic — it is:
1. **Weekly-first** as the native unit of thought (not a monthly budget divided by 4).
2. **Automatic monthly→weekly bill conversion** with **due-date-aware accrual**, so the reserve is always *actually* enough by the day the bill hits — not just on average.
3. A **single daily "Safe-to-Spend" number** that already accounts for every future obligation.

### 1.4 Legal & Trust Framing
**WeeklyVault is a personal budgeting and planning tool. It is NOT a bank, e-wallet, payment processor, or money-transfer service.**
- "Vaults" are **virtual accounting buckets**, not real sub-accounts. No user funds are ever held, moved, or transmitted by WeeklyVault.
- "Mark as paid" records that the user paid a bill **elsewhere** (their bank/app); it never initiates a payment.
- The app provides **no personalized investment or financial advice**. Savings features are neutral goal-tracking.
- This framing must appear in onboarding, the bills screen, and the ToS. Getting it wrong is an existential trust/regulatory risk, so it is a P0 constraint, not copy polish.

---

## 2. Target Audience & Personas

**v1 scope decision:** Ship for **predictable weekly amounts first**, but build the data model for variable income from day one (see [§SRS-3](#3-data-model)). This resolves the v1 contradiction where the persona was "freelancers/contractors" (irregular) but the model assumed a fixed allowance.

| Persona | Income pattern | Primary need | v1? |
|---|---|---|---|
| **Maya, 20 — student on family allowance** | Fixed weekly (₱ every Monday) | "Can I eat out today without missing my phone bill?" | ✅ Core |
| **Jae, 24 — part-time + freelance** | Variable weekly | Same, but income differs each week | ✅ (variable income) |
| **Ravi, 28 — hourly contractor** | Variable, occasionally skipped weeks | Buffer for zero-income weeks | 🔶 v1.1 (buffer logic) |

**Core pain point:** amortizing monthly obligations against weekly cash without a spreadsheet.
**Core job-to-be-done:** *"Tell me one number I can trust each day, and make sure my bills are always covered before they're due."*

---

## 3. Product Principles
1. **One number rules the home screen.** Safe-to-Spend today. Everything else is secondary.
2. **Never surprise the user with a shortfall.** Forecast danger days *before* they arrive.
3. **Tracking, not moving.** We reflect reality; we never touch money.
4. **Offline is the default, not a feature.** Logging must work on the subway.
5. **Setup in taps, not typing.** Bill templates, sensible defaults.

---

## 4. Scope & Release Plan

### v1 (MVP) — the core loop
Set up income → convert bills → auto-split on payday → see Safe-to-Spend → log expenses.
- FR-1 Income Setup (fixed + variable)
- FR-2 Bill Converter & **due-date accrual**
- FR-3 Payday Allocation Split (3 vaults)
- FR-4 Daily Safe-to-Spend
- FR-5 Quick Expense Logging
- FR-8 Per-bill accrual view *(new, replaces lumped reserve)*
- FR-9 Danger-day forecast *(new — the "wow")*

### v1.1
- FR-6 Bill reminders + **"Mark as paid"**
- FR-7 End-of-week rollover to Savings (+ streaks)
- FR-10 What-if subscription simulator

### v2
- Variable/zero-income buffer smoothing (Ravi)
- Shared/household allowances
- Bank import (read-only, via aggregator) — *only if trust framing holds*

---

## 5. Functional Requirements

| ID | Feature | Description | Priority | Release |
|---|---|---|---|---|
| **FR-1** | **Income Setup** | User enters income as **Fixed weekly amount** or **Variable (enter each payday)**; picks payday weekday; sets currency. | P0 | v1 |
| **FR-2** | **Bill Converter** | Add monthly subscriptions/bills (amount, due day, optional template). App computes both a flat weekly estimate *and* a due-date accrual schedule. | P0 | v1 |
| **FR-3** | **Payday Allocation Split** | On payday, split incoming amount into **Bills Reserve**, **Savings Vault**, **Safe-to-Spend** via ledger entries. | P0 | v1 |
| **FR-4** | **Daily Safe-to-Spend** | Show today's spendable cap, recomputed live from the ledger. Floors at 0; shows overspend state explicitly. | P0 | v1 |
| **FR-5** | **Quick Expense Logging** | ≤2-tap log: amount → category. Deducts from Safe-to-Spend. Works fully offline. | P0 | v1 |
| **FR-8** | **Per-Bill Accrual View** | Progress bar per bill: "Netflix ₱412 / ₱549 saved · due in 6 days." Replaces a single opaque reserve total. | P0 | v1 |
| **FR-9** | **Danger-Day Forecast** | Calendar/timeline flagging days where projected reserve < an upcoming bill, with the shortfall amount and suggested weekly top-up. | P1 | v1 |
| **FR-6** | **Bill Reminders & Mark-as-Paid** | Push on due date; **"Mark as paid"** records payment against the accrued bill (no money moves). | P1 | v1.1 |
| **FR-7** | **End-of-Week Rollover** | Optionally sweep leftover Safe-to-Spend into Savings at week close; track streaks. | P2 | v1.1 |
| **FR-10** | **What-If Simulator** | Slider: adding/removing a subscription shows instant impact on daily Safe-to-Spend. | P2 | v1.1 |

### 5.1 Overspend behavior (was undefined in v1)
When cumulative weekly expenses exceed `Wspend`:
- Daily cap displays **₱0** (never negative) with an "Over by ₱X this week" banner.
- The overspend is **not** silently drawn from Bills Reserve or Savings. The user is shown the choice: "Cover from Savings?" / "Borrow from next week?" — each an explicit, logged, reversible ledger action.

---

## 6. Key User Flows

**Onboarding (target < 90s):** Currency → income type & amount → payday → add bills from templates → see first Safe-to-Spend number.

**Payday ritual (retention hook):** Notification → open app → animated split of income into the three vaults → confirm.

**Daily loop (habit):** Open → glance at one number → optional 2-tap log → close.

---

## 7. KPIs & Success Metrics

| Metric | Definition | Target |
|---|---|---|
| **WAU retention** | Users logging ≥4 of 7 days | > 65% |
| **On-time bill coverage** | Bills whose accrued reserve ≥ amount by due date | > 95% |
| **Time-to-first-value** | Install → first Safe-to-Spend shown | < 90s median |
| **Danger-day accuracy** | Predicted shortfalls that would have occurred | > 90% precision |
| **Overspend recovery** | Weeks ending non-negative after an overspend day | tracked |

---

## 8. Non-Goals (v1)
- Moving/holding money, bank transfers, card issuing.
- Investment, credit, or personalized financial advice.
- Multi-currency *within one account* (single currency per user in v1).
- Bank account aggregation/import (v2, conditional).
- Web/desktop client (mobile only).

## 9. Risks & Assumptions
| Risk | Mitigation |
|---|---|
| Users think "Mark as paid" pays the bill | Explicit copy + one-time explainer; never use "Pay" |
| Variable income breaks the reserve math | Accrue against actual dates; surface danger days early |
| Envelope-app commoditization | Differentiate on weekly-first + forecast, not vaults |
| 4–5 payday months mistimes a bill | Due-date accrual (not flat 4.33) — see SRS-2 |

---

# PART II — SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## 1. System Architecture & Tech Stack *(decided)*

**Delivery sequencing:** **Phase A — mobile-first web app now.** **Phase B — Expo (React Native) app later**, reusing the same domain core. Everything is TypeScript + React so nothing is thrown away between phases.

### 1.1 Monorepo (so Phase B reuses Phase A)
`pnpm` workspaces + **Turborepo**:
- **`packages/core`** — pure TypeScript: Drizzle schema, the math engine (§2), ledger-folding, all business rules. **No UI, no platform APIs.** Imported by web now and Expo later.
- **`apps/web`** — the Phase A app.
- **`apps/mobile`** — the Phase B Expo app (stub for now).

### 1.2 Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Web client (Phase A)** | **Next.js** (App Router, React) as a **mobile-first PWA** | Installable, responsive, thumb-first layout; API routes remove the need for a separate backend |
| **Database** | **Turso** (libSQL / edge SQLite) | SQLite-compatible → the relational + ledger schema carries over verbatim; edge-hosted, cheap |
| **ORM** | **Drizzle** | First-class libSQL/Turso support; the *same* schema/query code runs on server now and in Expo later |
| **DB access (web)** | `@libsql/client` over HTTP, **server-side only** (route handlers / server actions) | On web, Turso is a remote DB — no secrets in the browser |
| **Auth** | **Clerk** (fast) *or* **Better Auth** (free/self-host, plugs into Drizzle+Turso) | ⚠️ New: Turso has no built-in auth. Clerk has drop-in Next.js + later Expo support |
| **Server logic** | **Next.js route handlers / server actions** + **Vercel Cron** | Bill-reminder scheduling and month-boundary jobs; no separate service |
| **Push (web)** | **Web Push API** (VAPID) via service worker | Works on Android/desktop; on iOS requires an *installed* PWA (16.4+). Full push maturity lands in Phase B |
| **Mobile client (Phase B)** | **Expo (React Native)** + **`@op-engineering/op-sqlite`** | Reuses `packages/core`; unlocks **Turso embedded replicas** for true local-first offline |

> Dropped vs. prior draft: **Flutter** (client is now full React) and **Supabase** (DB is now Turso; auth moves to Clerk/Better Auth, server logic to Next).

### 1.3 The honest offline trade-off
Turso's local-first superpower — **embedded replicas** (a real SQLite file on-device that syncs) — is a **native/`op-sqlite`** capability. A browser can't use it. So:
- **Phase A (web):** **online-first** with **optimistic UI** + a **PWA app-shell cache**. Core actions (log expense, view Safe-to-Spend) feel instant via optimistic local state, but a network round-trip persists them. Brief connectivity gaps are tolerated by an optimistic write queue in IndexedDB; extended offline use is **not** a Phase-A guarantee.
- **Phase B (Expo):** the append-only ledger + Turso embedded replicas deliver the **100%-offline** NFR from §5. This is *why* the ledger design matters even though web doesn't fully exploit it yet.

**Architecture shape:** `packages/core` holds all balance math; balances are always **derived** from the append-only ledger. Phase A reads/writes the ledger via Next server actions → Turso. Phase B reads/writes a local libSQL replica that syncs to the same Turso DB.

---

## 2. Mathematical Engine & Calculation Rules

### 2.1 Variables
- `A` = income amount for the current payday (fixed setting **or** the variable amount entered).
- `Bⱼ` = monthly amount of bill *j*; `dⱼ` = its due date.
- `S%` = savings target percentage.
- `today`, `payday`, `weekEnd` = dates.

### 2.2 Per-bill due-date accrual *(replaces the flat 4.33 divisor)*
For each active bill *j*, accrue toward `Bⱼ` across the paydays that fall **before its due date**, since the last time it was paid:

```
paydaysUntilDue(j) = number of scheduled paydays in [today, dⱼ)
requiredThisPayday(j) = max(0, (Bⱼ − alreadyAccrued(j)) / max(1, paydaysUntilDue(j)))
```

- Guarantees the reserve reaches `Bⱼ` **on time regardless of 4- or 5-payday months.**
- `Wsubs = Σⱼ requiredThisPayday(j)` — the amount to lock into Bills Reserve **this** payday.
- The old flat `Σ Bⱼ / 4.33` is kept **only** as a rough "typical weekly bills" display figure, never as the reserve driver.

### 2.3 Savings & Safe-to-Spend (per payday)
```
Wsavings = A × S%
Wspend   = A − (Wsubs + Wsavings)          # clamped ≥ 0; if negative, warn: income can't cover obligations
```

### 2.4 Dynamic daily safe cap *(v1 div-by-zero fixed)*
```
daysLeft   = max(1, daysUntil(weekEnd) )     # never 0 → no divide-by-zero on day 7
remaining  = Wspend − Σ(expenses this week)
Dspend     = max(0, remaining / daysLeft)    # floored at 0; overspend handled in FR-5.1
```
- On the final day, `daysLeft = 1` → the cap is simply the remaining balance.
- If `remaining < 0`: cap shows ₱0 + overspend banner (see PRD §5.1).

### 2.5 Danger-day detection (FR-9)
For each upcoming bill *j*, simulate accrual forward; flag any date where `projectedReserve(dⱼ) < Bⱼ`. Report shortfall and the extra weekly top-up that clears it.

---

## 3. Data Model

**Principle:** balances are **never stored as mutable fields** — they are folded from an **append-only ledger**. This is the single biggest correctness fix over v1 (v1's 3 tables couldn't answer "how much is in Bills Reserve right now?").

### 3.1 `users`
```jsonc
{
  "user_id": "UUID (PK)",
  "income_type": "FIXED | VARIABLE",
  "fixed_weekly_amount": 15000.00,   // null when VARIABLE
  "savings_percentage": 0.20,
  "payday_weekday": "MONDAY",
  "week_start_weekday": "MONDAY",
  "currency_code": "PHP",
  "created_at": "2026-07-28T00:00:00Z"
}
```

### 3.2 `income_events` *(new — enables variable income + history)*
```jsonc
{
  "income_id": "UUID (PK)",
  "user_id": "UUID (FK)",
  "amount": 15000.00,
  "received_at": "2026-07-28T00:00:00Z",
  "is_confirmed": true               // variable users confirm actual amount
}
```

### 3.3 `subscriptions` (bills)
```jsonc
{
  "subscription_id": "UUID (PK)",
  "user_id": "UUID (FK)",
  "title": "Netflix",
  "monthly_amount": 549.00,
  "due_day_of_month": 15,
  "template_key": "netflix",         // for icon/preset; nullable
  "is_active": true,
  "created_at": "..."
}
```

### 3.4 `ledger` *(new — the heart of the system; append-only)*
Every money movement between vaults is one immutable row. Balances = sum of rows per vault.
```jsonc
{
  "entry_id": "UUID (PK)",
  "user_id": "UUID (FK)",
  "type": "INCOME_SPLIT | EXPENSE | BILL_PAID | ROLLOVER | ADJUSTMENT",
  "vault": "BILLS_RESERVE | SAVINGS | SAFE_TO_SPEND",
  "amount": -250.00,                 // signed; +credit / -debit
  "subscription_id": "UUID | null",  // set for BILL_PAID / accrual
  "expense_id": "UUID | null",
  "occurred_at": "2026-07-28T14:30:00Z",
  "client_generated_id": "UUID",     // idempotency key for offline sync
  "created_at": "..."
}
```

### 3.5 `expenses`
```jsonc
{
  "expense_id": "UUID (PK)",
  "user_id": "UUID (FK)",
  "amount": 250.00,
  "category": "FOOD_DINING",
  "vault_source": "SAFE_TO_SPEND",
  "occurred_at": "2026-07-28T14:30:00Z",
  "client_generated_id": "UUID",     // idempotency
  "sync_state": "PENDING | SYNCED"
}
```

### 3.6 Derived (not stored)
```
vaultBalance(v) = Σ ledger.amount WHERE vault = v
```
Computed reactively on-device (Drift stream) and validated server-side.

---

## 4. Sync & Offline Design

**Idempotency (both phases):** every mutating row carries a `client_generated_id`; the server upserts on it, so retries/replays never double-count.

**Conflict resolution (both phases):** the `ledger` is **append-only**, so there are almost no true conflicts — concurrent writes just interleave. `users`/`subscriptions` config uses **last-write-wins by `updated_at`**, with `ADJUSTMENT` ledger entries for any correction (money history is never destructively edited).

**Phase A — web (online-first):**
- Writes go through Next server actions to Turso; the UI updates **optimistically** first for a native feel.
- An optimistic queue in **IndexedDB** buffers writes across brief network drops and replays them (idempotency keys make this safe).
- PWA service worker caches the app shell so the app opens offline, but *persisting* new data needs connectivity in this phase.

**Phase B — Expo (local-first):**
- A **Turso embedded replica** (local libSQL file via op-sqlite) is the on-device source of truth; all reads/writes are local and sub-ms.
- Background sync reconciles with the same Turso cloud DB on reconnect/foreground. This delivers the 100%-offline NFR.

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Cold start < 1.5s; expense-log commit (local) < 100ms; Safe-to-Spend recompute < 16ms (one frame) |
| **Offline** | **Phase A (web):** app shell opens offline; core actions optimistic with an IndexedDB replay queue for brief drops (extended offline not guaranteed). **Phase B (Expo):** 100% of logging/splitting/viewing works offline via Turso embedded replica; queued sync on reconnect |
| **Reliability** | No lost writes across offline/kill/reinstall (ledger + idempotency keys) |
| **Accessibility** | WCAG AA contrast; dynamic type; screen-reader labels on the Safe-to-Spend number |
| **Localization** | Currency & number formatting via locale; strings externalized |
| **Observability** | Client crash reporting; sync-failure metrics; no PII in logs |

---

## 6. Security

- **Auth:** **Clerk** (or Better Auth) — email + OAuth. Web: HttpOnly session cookies (no tokens in JS-reachable storage). Expo: secure session store.
- **Isolation:** Turso has no Postgres RLS, so isolation is enforced **server-side**: every Drizzle query is scoped to the authenticated `user_id`; the browser never talks to Turso directly. *Scale option:* Turso **database-per-user** for hard tenant isolation (deferred; single DB + `user_id` scoping for v1).
- **Local data:** Phase A stores only optimistic queue data in IndexedDB (non-sensitive, short-lived). Phase B encrypts the local libSQL replica at rest (SQLCipher), **key in iOS Keychain / Android Keystore** (hardware-backed where available) — we claim only what the OS actually guarantees.
- **App-level gate:** biometric (FaceID/Fingerprint) required to open, with PIN fallback.
- **Transport:** TLS 1.2+; certificate pinning on the API host.
- **No card/bank credentials** are ever collected or stored (see PRD §1.4).

---

## 7. Open Questions
1. Variable-income users: prompt for actual amount **on** payday, or infer from a rolling average until confirmed?
2. Week boundary vs. payday — always equal, or independently configurable? (Schema allows both.)
3. Rollover default: on or off? (Retention vs. surprise-savings trade-off.)
4. Buffer smoothing for zero-income weeks (Ravi) — v1.1 or v2?
5. Final product name (see §0.1).

---

*End of document.*
