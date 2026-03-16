# Celljevity Longevity OS

A GDPR-compliant healthcare platform for patient management with biomarker tracking, digital intake forms, service catalog, quote/invoice generation, and a document vault. Supports four user roles: Patient, Care Coordinator, Medical Provider, and Super Admin.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces |
| Language | TypeScript 5.9 |
| API server | Express 5 |
| Frontend | React 19, Vite 7, Tailwind CSS 4, shadcn/ui (Radix primitives) |
| Database | PostgreSQL, Drizzle ORM |
| Validation | Zod (v4), drizzle-zod |
| API codegen | Orval (OpenAPI 3.1 spec) |
| Auth | Session-based (express-session + connect-pg-simple), bcrypt |
| Build (server) | esbuild (CJS bundle) |
| Build (client) | Vite |

## Prerequisites

- **Node.js 24** (verified from runtime; no `.nvmrc` file present)
- **pnpm** (enforced by preinstall script -- yarn/npm will be rejected)
- **PostgreSQL** instance with a connection string

## Getting Started

```bash
# Install all dependencies
pnpm install

# Push the database schema (requires DATABASE_URL)
pnpm --filter @workspace/db push

# Seed the database
pnpm run db:seed

# Start the API server (requires PORT and DATABASE_URL)
pnpm --filter @workspace/api-server dev

# Start the frontend app (in a separate terminal)
pnpm --filter @workspace/celljevity-app dev
```

## Commands

### Development

| Command | Description |
|---------|-------------|
| `pnpm --filter @workspace/api-server dev` | Start API server (Express, tsx watch) |
| `pnpm --filter @workspace/celljevity-app dev` | Start frontend dev server (Vite) |
| `pnpm --filter @workspace/mockup-sandbox dev` | Start mockup sandbox dev server (Vite) |

### Build and Typecheck

| Command | Description |
|---------|-------------|
| `pnpm run build` | Typecheck all packages, then build all |
| `pnpm run typecheck` | Run `tsc --build` across the full project-reference graph |
| `pnpm --filter @workspace/api-server build` | Production esbuild bundle (`dist/index.cjs`) |
| `pnpm --filter @workspace/celljevity-app build` | Production Vite build |

### Database

| Command | Description |
|---------|-------------|
| `pnpm --filter @workspace/db push` | Push Drizzle schema to PostgreSQL |
| `pnpm --filter @workspace/db push-force` | Force-push schema (destructive, dev only) |
| `pnpm run db:seed` | Seed the database |

### Codegen

| Command | Description |
|---------|-------------|
| `pnpm --filter @workspace/api-spec codegen` | Generate React Query hooks and Zod schemas from OpenAPI spec |

## Monorepo Structure

```
.
├── artifacts/                  # Deployable applications
│   ├── api-server/             # @workspace/api-server -- Express 5 API
│   ├── celljevity-app/         # @workspace/celljevity-app -- React 19 patient/admin UI
│   └── mockup-sandbox/         # @workspace/mockup-sandbox -- UI component sandbox
├── lib/                        # Shared libraries
│   ├── api-spec/               # @workspace/api-spec -- OpenAPI 3.1 spec + Orval config
│   ├── api-client-react/       # @workspace/api-client-react -- Generated React Query hooks
│   ├── api-zod/                # @workspace/api-zod -- Generated Zod schemas
│   └── db/                     # @workspace/db -- Drizzle ORM schema, pool, seed
├── scripts/                    # @workspace/scripts -- Utility scripts (run via tsx)
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # Workspace package globs + catalog
├── tsconfig.base.json          # Shared TS config (composite, bundler resolution)
└── tsconfig.json               # Root project references
```

### Package Dependency Graph

```
celljevity-app --> api-client-react --> (generated from api-spec)
api-server     --> api-zod           --> (generated from api-spec)
api-server     --> db
```

## Environment Variables

| Variable | Required | Used By | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `@workspace/db` | PostgreSQL connection string |
| `PORT` | Yes | `@workspace/api-server` | Port the API server listens on |
| `SESSION_SECRET` | Yes (production) | `@workspace/api-server` | Express session secret. Falls back to a hardcoded dev secret in non-production. The server will throw if missing in production. |
| `NODE_ENV` | No | `@workspace/api-server` | Set to `production` for secure cookies and enforced session secret |
| `BASE_PATH` | No | `@workspace/celljevity-app` | Optional base path for Vite build |
| `REPL_ID` | No | `@workspace/celljevity-app` | Set automatically by Replit; controls dev-only Replit plugins |

## Database Schema

13 tables with UUID primary keys:

- **users** -- email, bcrypt password hash, role (Patient / Care Coordinator / Medical Provider / Super Admin)
- **patients** -- linked to users, auto-generated celljevityId, journey stage tracking
- **leads** -- prospect tracking with source and conversion status
- **service_catalog** -- service categories (Exosomes, Prometheus, NK Cells, Diagnostics, Other)
- **quotes** -- invoices with auto-incrementing number (`INV-YYYYMMDD-XXXX`), status state machine
- **invoice_line_items** -- line items per quote
- **documents** -- document vault with category and storage key
- **document_tokens** -- signed upload/download tokens with expiry
- **audit_logs** -- GDPR audit trail (action, entity, before/after snapshots)
- **security_events** -- login/logout/failed attempt tracking
- **biomarker_results** -- biomarker data with test date and results JSON
- **intake_forms** -- digital intake forms with versioned form data
- **consent_records** -- GDPR consent with revocation support

## TypeScript Composite Projects

Every package uses `composite: true` and the root `tsconfig.json` lists all packages as project references. Always typecheck from the root (`pnpm run typecheck`) so that cross-package `.d.ts` declarations are built in the correct order. Running `tsc` inside a single package may fail if its dependencies have not been built.

## Notes

- This project was originally developed on Replit. Several Vite configs include Replit-specific plugins (`@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`, `@replit/vite-plugin-runtime-error-modal`) that are conditionally loaded when `REPL_ID` is set.
- The frontend uses i18next for internationalization support.
- There is no `.nvmrc` or `.node-version` file in the repository. Node 24 was verified from the runtime environment but is not enforced by a config file.
