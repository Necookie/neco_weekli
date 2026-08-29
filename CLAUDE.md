# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Weekli** (`neco_weekli`) — turns a weekly paycheck into one trustworthy "Safe-to-Spend"
number while automatically setting aside every monthly bill before its due date. It is a
budgeting/planning tool only — it never holds or moves money. Product/spec source of truth
is [PRD_SRS.md](./PRD_SRS.md).

## Commands

```bash
pnpm install
cp .env.example .env                 # root — drizzle-kit + MCP servers read this
cp .env.example apps/web/.env.local  # apps/web — Next.js reads this

pnpm dev                             # turbo run dev  → http://localhost:3000
pnpm build                           # turbo run build
pnpm typecheck                       # turbo run typecheck (all packages)
pnpm lint                            # turbo run lint
pnpm test                            # turbo run test (all packages)

pnpm core:test                       # run just @neco/core's tests (Node's native test runner)
pnpm --filter @neco/core test -- --test-name-pattern=<name>  # run a single test

pnpm db:generate                     # drizzle-kit: generate SQL migrations from packages/core/src/db/schema.ts
pnpm db:push                         # drizzle-kit: push schema to Turso
pnpm --filter @neco/core db:studio   # drizzle studio
```

`@neco/core` and `apps/web` tests are plain `*.test.ts` files run directly via `node --test` (see the
`test` scripts in `packages/core/package.json` and `apps/web/package.json`) — there is no Jest/Vitest config.
Both run unified via `pnpm test` or package-scoped via `pnpm --filter @neco/core test` and `pnpm --filter web test`.

## Architecture

### Monorepo shape

pnpm workspaces (`apps/*`, `packages/*`) + Turborepo. Two packages exist today:

- **`packages/core`** (`@neco/core`) — platform-agnostic domain logic: money, dates, the
  budgeting math engine, ledger, and the Drizzle schema. Designed to be shared by the web
  app now and an Expo app later (see PRD_SRS.md §1.1 Monorepo rationale). It has **zero
  runtime deps** besides `@libsql/client`/`drizzle-orm` for the DB layer.
- **`apps/web`** — Next.js 15 (App Router) mobile-first PWA, the only consumer today.

`@neco/core`'s package exports are split on purpose:
```
"."         -> src/index.ts     # money, dates, engine, ledger, runway, types — NO db
"./schema"  -> src/db/schema.ts # Drizzle table defs — server-only
"./db"      -> src/db/client.ts # libSQL client — server-only
```
The root barrel (`.`) deliberately does **not** re-export the DB layer, since it pulls in
node/native deps that must never reach client bundles. Server code imports `@neco/core/schema`
or `@neco/core/db` directly.

### Money convention

Money is **always** an integer number of minor units (centavos) — see `packages/core/src/money.ts`.
Never store or accumulate money as a float. `toMinor`/`toMajor` convert at the UI boundary;
`formatMoney` renders via cached `Intl.NumberFormat` instances. `allocate()` splits an amount
across weights with zero rounding loss (largest-remainder method) — used wherever a total must
be exactly preserved across parts.

### The math engine (`packages/core/src/engine.ts` + `runway.ts`)

This is the product's core value prop and is spec'd in detail in PRD_SRS.md §2. Key
invariants baked into the code (see doc comments in `engine.ts`):

- Bills accrue against their **actual due date** (`requiredThisPayday`/`nextDueDate`), not a
  flat `/4.33` divisor — so 4- vs 5-payday months never mistime a bill.
- `computeSplit()` divides one payday's income into three vaults — `billsReserve`, `savings`,
  `safeToSpend` — with the invariant `billsReserve + savings + safeToSpend === income` always
  holding. Priority on shortfall is bills > savings > spend.
- `dailySafeCap()` never divides by zero (day 7 of the week) and never goes negative.
- `dangerDays()` flags bills that won't be fully funded by their due date at the current
  accrual pace.
- `runway.ts` adds a second, independent normalization layer: any bill frequency
  (WEEKLY/BIWEEKLY/MONTHLY/QUARTERLY/ANNUALLY) → weekly/daily burn rate, from which
  `calculateRunway()` derives weeks/days of runway and a HEALTHY/MODERATE/CRITICAL health
  band, and `calculateTimeImpact()` expresses any single transaction as "±N days/weeks of
  runway" for the activity feed.

All of the above are pure functions (no I/O) — `apps/web/src/lib/dashboard.ts`'s
`computeDashboard()` is the sole place that wires real `AppState` through this engine into a
render-ready view-model, memoized per state change in `store.tsx`.

### Web app state — client-only for now

There is no backend wired up yet. Despite the Drizzle schema and ledger design existing in
`@neco/core` (append-only `ledger` table is meant to be the source of truth — balances are
*derived*, never stored, per PRD_SRS.md §3.4), the web app currently keeps its entire
`AppState` (settings, bills, accruals, expenses, savings, contributions, targetSliders) in
React context (`apps/web/src/lib/store.tsx`) debounce-persisted to `localStorage`
(`apps/web/src/lib/storage.ts`, key `weekli:state:v1`). `dashboard.ts` explicitly says it
"stands in for real user data + ledger until auth and Turso are wired in." When wiring up
real persistence, the target shape to converge on is the ledger/vault model in
`packages/core/src/db/schema.ts` + `ledger.ts`, not the ad-hoc `AppState` shape in
`apps/web/src/lib/types.ts`.

`loadInitial()` (`storage.ts`) resets to `CLEAN_INITIAL_STATE` whenever
`settings.hasCompletedOnboarding !== true` — don't remove that guard without checking the
onboarding flow (`apps/web/src/app/onboarding/`, `onboarding-wizard.tsx`,
`applyOnboardingSetup()` in `store.tsx`), which is the only path that should ever seed real
bills/savings.

### Two parallel auth systems — don't conflate them

- **Clerk** (`@clerk/nextjs`) is the real auth: wired via `apps/web/src/middleware.ts`
  (`clerkMiddleware`), Google OAuth, `/sign-in`, `/sign-up`, `/sso-callback`. Currently every
  app route is listed as a public route in the middleware matcher, so `auth.protect()` never
  actually fires — routes aren't gated yet even though Clerk is fully configured.
  `apps/web/src/lib/auth.ts`'s middleware note aside, look here first for anything Clerk-related.
- A separate **native/local auth** system also lives in `apps/web/src/lib/auth.ts` +
  `store.tsx` (`signIn`/`signUp`/`signOut`): client-side SHA-256 password hashing (Web Crypto),
  email/password validation, and localStorage-based rate-limiting/lockout, with accounts and
  sessions stored under `neco_weekli_users_v1` / `neco_weekli_session_v1`. This is what
  `AuthModal` (`apps/web/src/components/auth/auth-modal.tsx`) presents as email/password
  sign-in, alongside a "Continue with Google" button that opens Clerk's own hosted flow.
  Treat these as two independent systems that happen to share one modal's UI — a user
  created via one is invisible to the other.

### Design system

`design.md` at the repo root documents the exact visual language the app follows (Wise's —
lime-green `#9fe870` primary accent, sage canvas, Wise Sans/Inter type pairing, 24px pill
radii, etc.). It is applied directly as CSS custom properties in
`apps/web/src/app/globals.css`'s Tailwind v4 `@theme` block. Check `design.md` before
introducing new colors, radii, spacing, or type scales — new UI should reuse its tokens
rather than inventing values.

### MCP servers

`.mcp.json` wires four MCP servers consumed via this CLI: `turso` (DB inspection/queries),
`github`, `filesystem`, `context7` (library docs). Their tokens come from `.env` — see
`.env.example` for the full list of required environment variables (Turso, Clerk, VAPID push
keys, GitHub PAT).
