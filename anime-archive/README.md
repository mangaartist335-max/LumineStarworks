# Lumine StarWorks — Anime Industry Archive (2006–2026)

A searchable, editable production history of an independent anime industry.
Browse any broadcast season, open any production to see its full creative team,
follow franchises from their first episode to their latest film, and trace every
fact back to the document that established it.

- **Seasonal calendar** — every Winter / Spring / Summer / Fall season from 2006 to 2026
  (plus announced 2027 titles), with grid, list and weekly-schedule views, search,
  sorting and filters. Multi-cour shows stay under their premiere season and appear
  as "continuing" in the seasons they run into.
- **Production pages** — organised tabs for the overview, broadcast runs (Japanese TV,
  advance broadcasts, streaming, English dubs, theatrical and home video kept separate),
  staff, Japanese and English cast, music, companies, related works, history &
  reception, and sources & revisions.
- **Studio, staff, music and franchise directories** — reusable profiles, filmographies,
  key staff, collaborations, staff transitions, composer and singer search, and
  franchise timelines that highlight studio changes.
- **Archive editor** — protected admin area to add anime and films, create the next
  season, register studios and people, edit broadcast schedules, assign composers and
  voice actors, import and export JSON, review conflicting records and restore earlier
  revisions.
- **Timeline validation** — checks broadcast weekdays, expected episode counts,
  skipped weeks and hiatuses, multi-cour spans, simultaneous regional broadcasts,
  film vs. TV releases, conflicting dates and duplicate productions.
- **Provenance everywhere** — every record is Confirmed, Provisional, Proposed,
  Conflicting or Superseded. Imports never overwrite a confirmed fact; disagreements
  become conflicts for an editor to review.

## Quick start (no setup needed)

```bash
cd anime-archive
npm install
npm run dev
```

Open <http://localhost:3000>. Without Supabase credentials the archive runs in
**local development mode**: it loads the seed data and saves editor changes to
`.data/archive.local.json` (git-ignored).

To edit, choose **Editor sign in** and use the passcode `starworks` (the default
for `npm run dev`; set `LOCAL_EDITOR_PASSCODE` to change it). Start again from the
seed at any time with `npm run archive:reset-local`.

## What's in the seed data

| Records | Status | Source |
| --- | --- | --- |
| Sinful Apex, Iron to Requiem: Season 1, Impact of Eden (Episode 0 + Season 1), EARTH: Metal Comet Seasons 1–4, Overture | **Confirmed** | The archive development brief |
| 73 sample productions across 2006–2027 with their own studios, staff, cast, networks and music | **Proposed** | The sample catalogue |

Only facts stated in the brief are recorded for the established productions.
Anything it doesn't state — Japanese titles, genres, synopses, networks, broadcast
times — is shown as *not yet documented*. Weekdays and episode counts that can be
worked out from dates are displayed as **derived** and never stored as fact. For
example, the archive notes that *EARTH: Metal Comet Season 2*'s 22 episodes span
25 Wednesday slots and asks for the three skipped weeks to be documented.

Proposed sample entries are clearly marked throughout the site and never reuse the
established studios, people or franchises. Approve them from **Archive editor →
Productions** (select, then "Mark as Confirmed").

## Connecting Supabase

1. **Create a project** at [supabase.com](https://supabase.com) and copy the project URL
   and the anon/publishable key from **Project Settings → API**.
2. **Apply the schema.** Either paste
   `supabase/migrations/20261020000000_archive_schema.sql` into the SQL editor and run
   it, or with the Supabase CLI:
   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```
3. **Load the seed data.** Add the service role key to `.env.local` and run
   `npm run db:seed` (safe to repeat). With a local Supabase stack,
   `supabase db reset` applies `supabase/seed.sql` automatically — regenerate it after
   changing the seed with `npm run db:seed-sql`.
4. **Configure the app.** Copy `.env.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. **Create an editor.** Sign up at `/sign-up`, then grant the role in the SQL editor:
   ```sql
   update public.archive_profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
   Admins can promote others to `editor` the same way.

Everyone can read the archive. Row Level Security only allows `editor` and `admin`
accounts to write, and the app writes through `archive_apply_changes()`, which applies
each change set (rows, revisions, citations, conflicts) in a single transaction.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase connection. Leave empty for local mode. |
| `SUPABASE_SERVICE_ROLE_KEY` | Only for `npm run db:seed`. Server-side only. |
| `ARCHIVE_DATA_MODE` | `local` forces the local store even when Supabase is configured. |
| `LOCAL_EDITOR_PASSCODE` | Editor passcode in local mode (required for production builds). |
| `LOCAL_SESSION_SECRET` | Extra secret for the local editor cookie. |
| `ARCHIVE_LOCAL_FILE` | Where local edits are stored. |
| `ARCHIVE_TODAY` | Pin "today" (YYYY-MM-DD) for demos and screenshots. |

## Commands

```bash
npm run dev                 # development server
npm run build && npm start  # production build
npm run check               # lint + typecheck + tests
npm test                    # Vitest suite (validation, seed, import rules, editor mutations)
npm run db:seed             # load the seed into Supabase
npm run db:seed-sql         # regenerate supabase/seed.sql
npm run archive:export -- out.json   # export the local archive as JSON
npm run archive:reset-local          # discard local edits
```

## Importing and exporting JSON

Exports and imports share one format:

```json
{
  "format": "lumine-archive",
  "version": 1,
  "source": { "title": "Production document #12", "kind": "production_document", "received_at": "2026-11-02", "provenance": "provisional" },
  "tables": {
    "productions": [{ "slug": "earth-metal-comet-season-2", "title_native": "…" }],
    "production_credits": [{ "production_id": "earth-metal-comet-season-2", "person_id": "kaihatsu-miura", "role": "director" }]
  }
}
```

- References accept ids **or slugs** (`"person_id": "kaihatsu-miura"`); episodes and
  runs can be referenced as `production-slug#3` and `production-slug#tv`.
- Rows without a `provenance` use `source.provenance` (Provisional by default).
- Every import is previewed first and recorded as its own source document, with
  field-level citations and an `import` revision for each change.
- A confirmed value is never overwritten: a different incoming value becomes an open
  conflict. Lower-ranked sources can't overwrite higher-ranked ones; a higher-ranked
  source can promote a record (e.g. Proposed → Confirmed). Empty values never erase
  recorded facts, and duplicate productions (same title, format and year) are blocked.

Export the whole archive from **Archive editor → Export** (`/api/export/archive`) or a
single production from its page (`/api/export/production/<slug>`).

## Project structure

```
anime-archive/
  app/                     Routes (App Router)
    seasons/               Calendar overview and /seasons/[year]/[season]
    anime/                 Browse + /anime/[slug] production pages
    studios/ staff/ music/ franchises/ search/ about/
    admin/                 Archive editor (protected) + Server Actions
    api/export/            JSON export route handlers
    sign-in/ sign-up/ auth/callback/
  components/              UI (shadcn-style primitives in components/ui)
  data/seed/               Established chronology + proposed sample catalogue
  lib/archive/             Domain model, validation, queries, mutations, import/export
    store/                 Local JSON store and Supabase store
  lib/admin/               Editor helpers (reference options, record lists)
  supabase/                Migration and generated seed.sql
  scripts/                 Seed, export and reset scripts
  tests/                   Vitest suites
```

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui-style
components on Radix · Supabase (Postgres, Auth, RLS) · Zod · Lucide icons · Vitest.
