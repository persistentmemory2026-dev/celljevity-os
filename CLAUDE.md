# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Celljevity Longevity OS — a GDPR-compliant healthcare platform for patient management with biomarker tracking, digital intake forms, service catalog, quote/invoice generation, and document vault. Supports four roles: Patient, Care Coordinator, Medical Provider, Super Admin. Documentation is partially in German.

## Commands

```bash
# Install dependencies (pnpm only — yarn/npm rejected by preinstall hook)
pnpm install

# Development (run in separate terminals)
pnpm --filter @workspace/api-server dev    # Express API on PORT from .env
pnpm --filter @workspace/celljevity-app dev # Vite frontend on 0.0.0.0

# Alternative: mock dev server (no database needed)
node dev-server.js  # Serves on :3001 with hardcoded mock data

# Build & typecheck
pnpm run build        # Typecheck all, then build all packages
pnpm run typecheck    # tsc --build across full project-reference graph

# Typecheck a single package
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/celljevity-app typecheck

# Database
pnpm --filter @workspace/db push         # Push Drizzle schema to PostgreSQL
pnpm --filter @workspace/db push-force   # Force-push (destructive)
pnpm run db:seed                          # Seed database

# API codegen (OpenAPI → React Query hooks + Zod schemas)
pnpm --filter @workspace/api-spec codegen
```

## Architecture

**pnpm monorepo** with workspace packages:

- `artifacts/api-server` (`@workspace/api-server`) — Express 5 API, session auth, esbuild for production
- `artifacts/celljevity-app` (`@workspace/celljevity-app`) — React 19 + Vite 7 + Tailwind 4 + shadcn/ui (Radix), react-router-dom v7, i18next for i18n
- `artifacts/mockup-sandbox` (`@workspace/mockup-sandbox`) — UI component sandbox
- `lib/db` (`@workspace/db`) — Drizzle ORM schema, PostgreSQL pool, seed script. Exports via `@workspace/db` (pool) and `@workspace/db/schema` (tables)
- `lib/api-spec` (`@workspace/api-spec`) — OpenAPI 3.1 YAML + Orval config
- `lib/api-client-react` (`@workspace/api-client-react`) — Generated React Query hooks (from Orval)
- `lib/api-zod` (`@workspace/api-zod`) — Generated Zod schemas
- `convex/` — Convex backend (schema for users, services, quotes, quoteItems, documents). Project: `dashing-fennec-674`

**Dependency flow:**
```
celljevity-app → api-client-react → (generated from api-spec)
api-server     → api-zod          → (generated from api-spec)
api-server     → db
```

## TypeScript

- TypeScript 5.9 with composite project references. Always typecheck from root (`pnpm run typecheck`) — running `tsc` in a single package may fail if its dependencies aren't built.
- `tsconfig.base.json`: `bundler` module resolution, `es2022` target, `strictNullChecks: true`, `noImplicitAny: true`, `strictFunctionTypes: false`
- Validation: Zod (v4) everywhere, `drizzle-zod` for DB schema ↔ Zod bridging

## Environment

Requires: Node.js 24, pnpm, PostgreSQL. Key env vars: `DATABASE_URL`, `PORT`, `SESSION_SECRET` (required in prod). See `.env.example` for full list. Replit-specific Vite plugins load conditionally when `REPL_ID` is set.

## Database

13 PostgreSQL tables with UUID PKs (Drizzle ORM). Also a parallel Convex schema in `convex/schema.ts` with 5 tables (users, services, quotes, quoteItems, documents).
