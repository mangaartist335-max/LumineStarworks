@AGENTS.md

# Lumine StarWorks Anime Archive — project guide

This folder is a standalone Next.js app (the repository root holds a separate
project). Run every command from `anime-archive/`.

## Commands

- `npm run dev` — dev server (local mode needs no setup; editor passcode `starworks`)
- `npm run check` — lint + typecheck + tests; run before every commit
- `npm test` — Vitest (pure logic in `tests/`, node environment)
- `npm run build` — production build
- `npm run db:seed-sql` — regenerate `supabase/seed.sql` after editing `data/seed/`
- `npm run archive:reset-local` — drop local edits (`.data/archive.local.json`)

## Architecture

- **One data model, two stores.** `lib/archive/types.ts` mirrors the SQL tables
  (snake_case). The app loads all tables into an `ArchiveTables` snapshot from either
  the local JSON store (`store/local.ts`, used when Supabase env vars are missing) or
  Supabase (`store/supabase.ts`). `ArchiveIndex` (`archive-index.ts`) builds lookups
  once per snapshot; `queries.ts` turns it into plain view models for pages.
- **Pages** call `loadArchive()` from `lib/archive/server.ts` (request-scoped,
  `connection()` keeps them dynamic) and pass serializable view models to client
  components. Next 16: `params`/`searchParams` are promises; use `PageProps<"/route">`.
- **Writes are pure.** `mutations.ts` and `import-export.ts` take the current tables
  and return a `ChangeSet` (rows + revision rows + citations + conflicts). Server
  Actions in `app/admin/actions.ts` check `requireEditor()`, compute the change set
  from `loadTablesForWrite()`, then `commitChanges()` applies it — atomically via the
  `archive_apply_changes` RPC in Supabase mode.
- **Forms are schema-driven.** `lib/archive/schemas.ts` (zod) is the single
  definition of a valid row for editor forms and imports. `lib/archive/forms.ts`
  lists the fields per entity; `components/admin/entity-form.tsx` renders them.
- **Validation** (`validation.ts`) never mutates data. It reports errors, warnings
  and info notes, and *derives* weekdays and episode counts without storing them.

## Archive rules (do not break these)

- Never invent established details. If the source documents don't state it, leave it
  `null` and let the UI show "not yet documented".
- Every generated or sample entry is `proposed` until an editor approves it.
- Imports never overwrite a `confirmed` value — they create a `record_conflicts` row.
- Every change writes a `revisions` row; history is append-only.
- Seed ids come from `stableId(namespace, key)` so they stay identical across runs.
- Japanese broadcasts and English dubs are separate `broadcast_runs`; dates are civil
  dates in the run's own time zone, and late-night times may exceed 24:00.

## Conventions

- TypeScript strict, `@/` path alias, Tailwind v4 tokens from `app/globals.css`
  (colors as CSS variables, dark theme default, provenance colors `prov-*`).
- UI primitives live in `components/ui` (shadcn style on `radix-ui`); archive-specific
  pieces in `components/archive`, `components/anime`, `components/admin`.
- Keep copy warm and plain. Empty states explain what's missing and how to add it.
- Accessibility: label every control, use `aria-live` for async feedback, keep focus
  rings, respect `prefers-reduced-motion`.
- Add a Vitest case for any new validation rule or import/mutation behaviour.
