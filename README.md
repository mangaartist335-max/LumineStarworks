# BuildBrief

BuildBrief turns a rough app, website, SaaS, or game idea into a structured
development blueprint you can hand straight to an AI coding agent.

```
IDEA → STRUCTURED BUILD PLAN → AI-READY DEVELOPMENT PROMPT
```

Describe an idea and BuildBrief generates a full blueprint: an MVP
definition, core vs. later features, screens and user flow, a recommended
tech stack, a database schema, a folder structure, a 48-hour build plan, a
definition of done, and a ready-to-paste Claude Code prompt with matching
`CLAUDE.md` and `AGENTS.md` files.

Then hit **Build App**: BuildBrief turns the blueprint into a working,
clickable single-file web app (or game) you can try right in the page and
download.

## Other apps in this repository

This repository also contains separate apps that share nothing with BuildBrief:

- [`connected/`](connected/README.md): **Connected Desktop**, a 2012-2013 style computer that runs in the browser, with its own web archive, programs and games.
- [`apps/mobile/`](apps/mobile/README.md): **BuildBrief for iOS and Android**, the native mobile app. It shares this app's accounts, projects and AI.
- [`plantpal/`](plantpal/README.md): **PlantPal**, an Expo mobile app that reminds you when to water your houseplants.
- [`yal/`](yal/README.md): **YourAnimeList**, the anime database and forums shown inside the desktop's browser.
- [`moneybeats/`](moneybeats/README.md): **MoneyBeats**, a Flutter offline music player for Android, iOS and Windows (Phase 1: local MP3 library and player).

To put those two online as their own Vercel projects (this app's deployment stays as it is), follow [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md).

Run both with `cd connected && npm run dev:all`. Status and open questions are in [`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md).

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Row Level Security)
- Anthropic Claude API
- Deployed on Vercel

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the **Project URL** and the
   **anon / publishable key**.
3. Email/password auth is enabled by default — no changes needed for local
   development. If you want new accounts to sign in immediately without
   confirming their email (handy for local testing), turn off "Confirm
   email" under **Authentication → Sign In / Providers → Email**.

### 3. Run the database migration

Apply the files in `supabase/migrations/` to your project, in order
(`0001_init.sql`, `0002_generation_events.sql`, `0003_generation_status.sql`, `0004_app_builds.sql`, then `0005_mobile_app.sql`). Either:

- Paste each file's contents into the Supabase Dashboard's **SQL Editor** and run it, or
- Use the Supabase CLI:

  ```bash
  supabase link --project-ref your-project-ref
  supabase db push
  ```

This creates the `profiles` and `projects` tables, enables Row Level
Security so each user can only read/write their own rows, and adds a
trigger that creates a `profiles` row automatically when someone signs up.
`0002` adds `generation_events`, which caps each user at 5 generations
(new BuildBriefs plus regenerations) per rolling 24 hours, so a single
account can't run up your Anthropic bill. Change `DAILY_GENERATION_LIMIT`
in `lib/generation-limit.ts` to adjust it. Generation is blocked with an
error until this table exists. `0003` adds `generation_status`,
`generation_error` and `generation_started_at` to `projects`: generation runs
in the background, and these let the project page show progress and the
real reason a generation failed. `0004` adds the Build App columns
(`app_html`, `app_status`, `app_error`, `app_started_at`) and a separate
daily allowance of 5 app builds per user (`DAILY_APP_BUILD_LIMIT`).
`0005` adds what the mobile app needs: project archiving and task progress,
a push-notification token on profiles, and `delete_my_account()` so people
can delete their own account (used by the website and the app).

### 4. Get an Anthropic API key

Create a key at [console.anthropic.com](https://console.anthropic.com).
BuildBrief calls Claude server-side only — the key is never sent to the
browser.

### 5. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/publishable key. |
| `ANTHROPIC_API_KEY` | Your Anthropic API key (server-only). |
| `ANTHROPIC_MODEL` | The Claude model used for generation, e.g. `claude-sonnet-5`. |

### 6. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000), create an account,
and generate your first BuildBrief.

## Deploying

BuildBrief deploys cleanly to [Vercel](https://vercel.com):

1. Push this repository to GitHub and import it in Vercel.
2. Add the four environment variables from `.env.example` in the Vercel
   project settings.
3. Deploy. Generation and app builds run in the background after the
   request returns (`after()`), with `maxDuration = 300` on the generation
   and build routes so Claude has time to finish.
4. In Supabase, add your production URL under **Authentication → URL
   Configuration → Redirect URLs** if you use email confirmation links.

## Build App

The **Build App** button on a project asks Claude to turn the blueprint into
one self-contained HTML file (inline CSS and JS, no external requests) that
implements the MVP features with sample data. The result is stored on the
project and previewed in an `<iframe sandbox>` **without** `allow-same-origin`,
so the generated code runs in an opaque origin and can't touch BuildBrief's
session, cookies or storage. Users can switch between phone and desktop
previews, rebuild, or download the `.html` file.

## Project structure

```
app/
  page.tsx                 Landing page
  auth/                    Sign in / sign up (server actions)
  (app)/                   Authenticated area (shared sidebar layout)
    dashboard/             Project list
    projects/new/          New project form
    projects/[id]/         BuildBrief viewer/editor
    settings/              Account settings
  api/projects/            Generation endpoints (Claude calls happen here)
components/                UI, dashboard, project, and auth components
lib/
  supabase/                Browser + server Supabase clients, proxy helper
  anthropic.ts             Claude generation (structured tool-call output)
  brief-schema.ts          Zod schema validating every generated brief
  markdown.ts              Markdown export helpers
  types.ts                 Shared BuildBrief/Project types
supabase/migrations/       SQL schema + RLS policies
proxy.ts                   Session refresh + route protection (Next.js 16 proxy)
```
