# Workspace

## Overview

Celljevity Longevity Operating System — a GDPR-compliant healthcare platform with four user roles (Patient, Care Coordinator, Medical Provider, Super Admin). Patient management system with biomarker tracking, digital intake forms, service catalog, quote/invoice generation, and document vault.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: Session-based (express-session + connect-pg-simple), bcrypt password hashing
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Database Schema

13 tables, all using UUID primary keys (`gen_random_uuid()`):

- **users** — email, bcrypt passwordHash, role (PATIENT/CARE_COORDINATOR/MEDICAL_PROVIDER/SUPER_ADMIN), isActive
- **patients** — linked to users, celljevityId (auto-generated), journeyStage (ACQUISITION→INTAKE→DIAGNOSTICS→PLANNING→TREATMENT→FOLLOW_UP), isLead, medical history, assigned coordinator/provider
- **leads** — lead/prospect tracking with source (WEBSITE/REFERRAL/PARTNER/EVENT/SOCIAL_MEDIA/DIRECT/OTHER), status (NEW→CONTACTED→QUALIFIED→CONVERTED/LOST), conversion to patient
- **service_catalog** — category (EXOSOMES/PROMETHEUS/NK_CELLS/DIAGNOSTICS/OTHER), pricing, partner info
- **quotes** — invoice/quote with auto-incrementing INV-YYYYMMDD-XXXX number, status (DRAFT→SENT→ACCEPTED→REJECTED→CANCELLED→PAID), currency, exchange rate
- **invoice_line_items** — per-quote line items with service ref, qty, unit price, auto-calculated line total
- **documents** — document vault with category, storageKey pattern, file tracking
- **document_tokens** — signed tokens for upload/download with expiry and single-use enforcement
- **audit_logs** — GDPR audit trail (action, entity, before/after snapshots, IP, user agent)
- **security_events** — login/logout/failed attempts, IP tracking
- **biomarker_results** — biomarker tracking with test date, category, results JSON
- **intake_forms** — digital intake forms with versioned form data JSON
- **consent_records** — GDPR consent with type, version, IP recording, revocation support

## API Endpoints

All routes mounted under `/api`:

- **Auth**: POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/me
- **Users**: GET /users, GET /users/:id, PATCH /users/:id, GET /users/audit-logs (admin)
- **Patients**: GET /patients, POST /patients, GET /patients/:id, PATCH /patients/:id, GET /patients/me/profile
- **Leads**: GET /leads, POST /leads, GET /leads/:id, PATCH /leads/:id, DELETE /leads/:id, POST /leads/:id/convert
- **Services**: GET /services, POST /services, GET /services/:id, PATCH /services/:id
- **Quotes**: GET /quotes, POST /quotes, GET /quotes/:id, PATCH /quotes/:id/status, POST /quotes/:id/line-items, DELETE /quotes/:id/line-items/:lineItemId
- **Documents**: GET /patients/:id/documents, POST /patients/:id/documents, PUT /documents/:id/upload (token-based), GET /documents/:id/download, GET /documents/:id/content (token-based), DELETE /documents/:id
- **Intake**: GET /intake, POST /intake, GET /intake/:id
- **Biomarkers**: GET /biomarkers, POST /biomarkers, GET /biomarkers/:id
- **Consent**: GET /consent, POST /consent, POST /consent/:id/revoke
- **GDPR**: GET /gdpr/export (Article 20), POST /gdpr/delete (Article 17)
- **Health**: GET /healthz

## Middleware

- **requireAuth** — session validation with 30-min inactivity timeout
- **requireRole(roles)** — RBAC by user role
- **requireSelfOrRole(paramName, roles)** — allows self-access or specified roles
- **auditLog(action)** — logs data changes with before/after snapshots
- **logSecurityEvent(eventType)** — tracks auth events

## Session Management

- Cookie name: `celljevity.sid`
- Store: PostgreSQL via connect-pg-simple (`user_sessions` table)
- 30-minute inactivity timeout (sliding window)
- HTTP-only, secure, SameSite=lax cookies

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, session, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers
- Middleware: `src/middlewares/` — auth.ts, rbac.ts, audit.ts
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, bcrypt, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec. Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
