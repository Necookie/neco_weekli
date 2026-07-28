# Weekli (`neco_weekli`)

Turn a **weekly** paycheck into one trustworthy number — how much you can safely
spend **today** — while automatically setting aside every monthly bill before
its due date.

> Weekli is a budgeting & planning tool. It is **not** a bank, wallet, or payment
> processor — it never holds or moves money. See [PRD_SRS.md](./PRD_SRS.md).

## Stack

| Layer | Choice |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Domain core | `@neco/core` — TypeScript, zero-dep math engine + ledger (shared by web now, Expo later) |
| Web (Phase A) | Next.js (App Router) mobile-first **PWA** |
| Database | Turso (libSQL / edge SQLite) via Drizzle ORM |
| Auth | Better Auth *(or Clerk)* — not yet wired |
| Mobile (Phase B) | Expo + `op-sqlite` (Turso embedded replicas → true offline) |

## Layout

```
.
├── packages/core     # money, dates, math engine, ledger, Drizzle schema (+ tests)
├── apps/web          # Next.js mobile-first PWA
├── PRD_SRS.md        # product + software spec (source of truth)
├── .env.example      # every env var you need
└── .mcp.json         # MCP servers (Turso, GitHub, filesystem, context7)
```

## Getting started

```bash
pnpm install
cp .env.example .env                 # fill in Turso + auth
cp .env.example apps/web/.env.local  # Next.js reads this
pnpm dev                             # http://localhost:3000
```

## Useful scripts

```bash
pnpm core:test     # run the domain-core test suite (Node's native runner)
pnpm typecheck     # type-check every package
pnpm db:generate   # drizzle-kit: generate SQL migrations from the schema
pnpm db:push       # push schema to Turso
```

## Status

- [x] Monorepo + tooling
- [x] Domain core: money, dates, **due-date accrual engine**, ledger — fully tested
- [x] Drizzle schema (users, income_events, subscriptions, ledger, expenses)
- [x] Next.js mobile-first PWA shell with a live Safe-to-Spend dashboard (demo data)
- [ ] Auth (Better Auth) + real user data
- [ ] Wire the dashboard to Turso via server actions
- [ ] Expense logging, bill reminders, rollover
- [ ] Phase B: Expo app reusing `@neco/core`
