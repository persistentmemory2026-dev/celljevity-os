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

## Nia (External Documentation & Research)

Use Nia MCP server for external documentation, GitHub repos, package source code, and research. Invoke when needing to index/search remote codebases, fetch library docs, explore packages, or do web research.

### CRITICAL: Nia-First Workflow

**BEFORE using WebFetch or WebSearch, you MUST:**

1. **Check indexed sources first**: `manage_resource(action='list', query='relevant-keyword')` - Many sources may already be indexed
2. **If source exists**: Use `search`, `nia_grep`, `nia_read`, `nia_explore` for targeted queries
3. **If source doesn't exist but you know the URL**: Index it with `index` tool, then search
4. **Only if source unknown**: Use `nia_research(mode='quick')` to discover URLs, then index
5. **Subscribe to a source**: Use Nia to subscribe to a source by using manage_resource tool (subscribe option)

**Why this matters**: Indexed sources provide more accurate, complete context than web fetches. WebFetch returns truncated/summarized content while Nia provides full source code and documentation.

### Deterministic Workflow

1. Check if the source is already indexed using manage_resource (when listing sources, use targeted query to save tokens since users can have multiple sources indexed) or check any nia.md files for already indexed sources.
2. If it is indexed, check the tree of the source or ls relevant directories.
3. After getting the grasp of the structure (tree), use 'search', 'nia_grep', 'nia_read' for targeted searches.
4. If helpful, use the context tool to save your research findings to make them reusable for future conversations.
5. Save your findings in an .md file to track: source indexed, used, its ID, and link so you won't have to list sources in the future and can get straight to work.

### Notes

- **IMPORTANT**: Always prefer Nia tools over WebFetch/WebSearch. Nia provides full, structured content while web tools give truncated summaries.
- If the source isn't indexed, index it. Note that for docs you should always index the root link like docs.stripe.com so it will always scrape all pages.
- If you need to index something but don't know the link for that source, use nia_research (quick or deep modes).
- Once you use the index tool, do not expect it to finish in 1-3 seconds. Stop your work or do something that will make your work pause for 1-5 minutes until the source is indexed, then run manage_resource again to check its status. You can also prompt the user to wait if needed.

### Pre-WebFetch Checklist

Before ANY WebFetch or WebSearch call, verify:
- [ ] Ran `manage_resource(action='list', query='...')` for relevant keywords
- [ ] Checked nia-sources.md or nia.md files for previously indexed sources
- [ ] Confirmed no indexed source covers this information
- [ ] For GitHub/npm/PyPI URLs: These should ALWAYS be indexed, not fetched
