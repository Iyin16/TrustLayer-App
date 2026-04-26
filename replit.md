# Workspace

## Overview

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
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## TrustLayer (artifacts/trustlayer)

React + Vite + Tailwind app for data trust intelligence. Auth and data via Appwrite.

- **Profile** (`src/lib/profile.ts`): full_name, role, organization, timezone, notifications_enabled, risk_threshold (1–50, default 5). Persisted in Appwrite Account preferences (`account.updatePrefs`) — no extra collection setup required. `loadOrCreateProfile` materializes defaults on first read; `updateProfile` also syncs `account.name` when full_name changes.
- **Datasets** (`src/lib/datasets.ts`): trust_score and status are NEVER user-editable. `computeLocalTrustScore` is the single authority and runs on every create/update. Status follows directly from the score band (≥80 Healthy, ≥60 Warning, else At Risk).
- **Trust Explainer** (`src/lib/insights.ts`, `src/pages/Assistant.tsx`): deterministic, no LLM. `explainRisk`, `topRiskyDatasets`, `systemHealthSummary`, and `fixSuggestions` derive plain-language guidance only from the dataset's own metadata.
- **OpenMetadata** (`src/lib/openmetadata.ts`): `syncFromOpenMetadata` ingests real catalog tables; `syncMockedMetadata` imports a fixed sample catalog so the pipeline can be exercised without a live server.
- **Settings** (`src/pages/Settings.tsx`): profile, organization, notifications (enable + risk_threshold slider), and OpenMetadata integration card. No hardcoded user names.
- **Reports** (`src/pages/Reports.tsx`): Generates a full Data Trust Report with executive summary, KPI grid, top risky datasets, full dataset catalog, and recommendations. Exports to **PDF** (opens a print-ready HTML page via `window.open`) or **CSV** (Blob download). No external libraries — fully native browser APIs.
