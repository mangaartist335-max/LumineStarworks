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

Apply `supabase/migrations/0001_init.sql` to your project. Either:

- Paste its contents into the Supabase Dashboard's **SQL Editor** and run it, or
- Use the Supabase CLI:

  ```bash
  supabase link --project-ref your-project-ref
  supabase db push
  ```

This creates the `profiles` and `projects` tables, enables Row Level
Security so each user can only read/write their own rows, and adds a
trigger that creates a `profiles` row automatically when someone signs up.

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
3. Deploy. The generation endpoints (`app/api/projects/route.ts` and
   `app/api/projects/[id]/regenerate/route.ts`) set `maxDuration = 120` so
   the Claude call has enough time to finish on Vercel's Node.js runtime.
4. In Supabase, add your production URL under **Authentication → URL
   Configuration → Redirect URLs** if you use email confirmation links.

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
