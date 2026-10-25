# YourAnimeList (YAL) — October 2013

A working recreation of **YourAnimeList**, the anime and manga database and community from the Lumine StarWorks internet-history project, as fans used it in 2012–2013.

YAL starts from the archived *Impact of Eden* episode discussion pages and builds the rest of the site around them: anime profiles, characters, staff and studios, seasonal charts, forums, member accounts and anime lists, reviews, recommendations, statistics, search, and a time machine that shows the site exactly as it stood at any moment between January 1, 2012 and December 31, 2013.

## Quick start

```bash
cd yal
npm install
npm run dev
```

Open <http://localhost:3000>. With no Supabase settings, YAL runs in **local demonstration mode**: the archive and catalogue are bundled, and accounts, lists, replies and reviews are saved to `.data/yal.local.json` (git-ignored). Run `npm run yal:reset-local` at any time to start fresh.

## The time machine

The dark Lumine StarWorks bar above the YAL header controls the archive moment. The default visit is **Thursday, October 24, 2013, 12:00 JST**.

- Pick a date and time (JST) or use the **Jump to…** list.
- Shareable links: add `?asof=2013-10-06` or `?asof=2013-10-06T09:00` to any URL.
- A record appears only after its own timestamp: anime entries from when they were listed, threads from their creation time, each reply at its post time, character facts after the episode that revealed them, and scores, polls and view counts after the snapshot that captured them.
- The real current date is never used.

Things to try:

| Moment | What you see |
| --- | --- |
| Sep 14, 2013 | Impact of Eden is not in the database yet |
| Oct 5, 2013 21:00 | Premiere day: "Not yet aired", no Episode 1 thread |
| Oct 6, 2013 03:00 | The Episode 1 thread is half an hour old, with 5 replies |
| Oct 13, 2013 | Episode 2 discussion is open; Episode 3 is not |
| Oct 24, 2013 | All three threads with their archived totals; Episode 4 "Not aired yet" |
| Feb 1, 2012 | The Recommendations board while Sinful Apex has just finished |

Members act in archive time too. Signing up while viewing Oct 24, 2013 gives you that join date, and your replies, list updates and reviews are stamped with the moment you were viewing. They appear in any view from then on and stay hidden before it. Each row also keeps its real `recorded_at` time.

## What's in the archive

| Records | Provenance |
| --- | --- |
| Impact of Eden Episode 1, 2 and 3 discussion threads: 3,126 posts by 218 members across 158 archived pages, with avatars, ranks, join dates, post counts, quotes, spoilers and edit notes | **archived**: recovered from the reference pages |
| Thread snapshots: reply/view totals, polls, "users viewing", hot subthreads | **archived**: shown only from their capture time |
| Anime, characters, staff, voice cast, studios and companies | **documented**: from the established references; unknown facts are left blank |
| 14 general forum threads, 6 reviews, 4 recommendations, and the copy of 10 news posts | **reconstructed**: sample content written for the archive and labelled in every record |
| Archive members' anime lists | **derived**: from posting in episode threads |
| Accounts, lists, replies, reviews and topics made by visitors | **member** |

### References used

| Reference | Status |
| --- | --- |
| `yal_impact_of_eden_ep1_2013.html`, `…ep2_2013.html`, `…ep3_2013.html` and their 155 paginated pages | Found on the `claude/relaxed-johnson-5ifuhj` branch (`ioe-offline/`) and imported in full by `scripts/reference/extract_yal_threads.py` |
| `yal_impact_of_eden_nightpolis_winter_2005_YAL_matched.html` | **Not found** in the workspace or any branch |
| `yal_impact_of_eden_nightpolis_winter_2005_MAL_style.html` | **Not found** in the workspace or any branch |
| AniFanWiki, AniWire, SakugaThread, MunchyRoll and AdultDrift pages from the same pack | Used for cast, credits, broadcast slot, opening theme, producers, licensing and the archived score |
| `claude/anime-archive` branch (`data/seed/established.ts`) | Used for Sinful Apex, Iron to Requiem and the Episode 0 special |

The Nightpolis Winter OVA page follows the written brief: a separate 2005 OVA record with its own ID and the same profile tabs as the TV entry (Overview/details, Characters & Staff, Episodes, Videos, Reviews, Recommendations, Stats and Forum). Every undocumented field is marked as pending.

### Deliberate gaps

- Impact of Eden episode records after Episode 3 are not archived. The episode list derives only the *next* weekly slot from the documented Saturday 25:58 schedule.
- Nightpolis Winter has no documented release date, studio, staff, cast or episode count.
- Glass Cathedral, Circuit Hearts: Reload, Vacant Crown: Liminal War, Ghost Eater, Azure Sorcerer and Neon Afterimage are listed by name only.
- Posts inside each episode's "hot subthreads" were not recovered. Those threads exist from the snapshot onward with their archived reply totals.
- Ranks stay "N/A" until at least three titles have archived scores.

### One corrected timestamp

Episode 1 post #82 is recorded as "Oct 5, 2013, 04:02 EDT", which is before the thread existed. Its neighbours #81 and #83 bracket the same time one day later, so YAL orders and reveals the post at that slot while still displaying the recorded timestamp (`lib/archive.ts`, `effectiveTime`).

## Using Supabase

1. Create a project at [supabase.com](https://supabase.com) and copy the **Project URL** and **anon / publishable key** from **Project Settings → API**.
2. Apply the schema: paste `supabase/migrations/20131024000000_yal_schema.sql` into the SQL editor, or use `supabase link --project-ref …` and `supabase db push`.
3. Load the archive: run `npm run db:seed-sql` to regenerate `supabase/seed.sql`, then paste it into the SQL editor. With a local Supabase stack, `supabase db reset` applies it automatically. The seed is safe to run more than once.
4. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. For local testing you can turn off "Confirm email" under **Authentication → Sign In / Providers → Email**. Otherwise new members confirm by email before logging in. In Supabase mode, members log in with their email address.

In Supabase mode, accounts use Supabase Auth, and lists, replies, topics, follows, reports, reviews, recommendations and friends live in Postgres. Row Level Security protects them, and security-definer functions number forum posts and rate-limit them. The catalogue and the recovered archive are versioned in `data/` and bundled with the app. The seed mirrors them into normalised Postgres tables, ready for admin tooling in a later phase.

The migration and seed were validated against PostgreSQL 16 with a stand-in for Supabase's `auth` schema. That run covered sign-up, reserved usernames, post numbering (a member reply to Episode 1 becomes #1114), rate limits, and every ownership policy. They have not yet been run against a hosted Supabase project.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Unit tests (time rules, BBCode safety, archive integrity, historical visibility, seed consistency) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:seed-sql` | Regenerate `supabase/seed.sql` from `data/` |
| `npm run yal:reset-local` | Delete the local demo store |
| `npm run e2e` | Browser walkthrough of the flows below (needs a running server; creates a test account) |
| `npm run screenshots` | Capture the comparison screenshots (needs a running server; set `YAL_URL`, default `http://localhost:3000`) |

## Testing

`npm test` runs 40 checks with Node's test runner. They cover:

- **Time:** Saturday 25:58 broadcast notation, JST date handling, and clamping to the archive window.
- **BBCode:** quotes, spoilers, lists, unclosed tags, literal HTML, and blocking `javascript:` links.
- **Archive import:** all 1,113 / 945 / 1,068 posts present, thread metadata preserved, post numbers unique, and no post earlier than its thread.
- **History rules:** the October 5 / 6 / 13 / 20 / 24 checkpoints from the brief, entry listing dates, the Nightpolis OVA staying separate, and no news ahead of the viewed date.
- **Seed consistency:** every reference resolves, credits match the brief, no back-catalogue title is credited to Studio Burst, reconstructed authors had already joined, and nothing is dated after 2013.

Walkthrough, scripted as `npm run e2e` (Playwright, against a running server):

1. Sign up, then add Impact of Eden to your list and edit progress, score, dates and notes.
2. In the Episode 1 thread: open a spoiler, switch to Newest First, page through, quote a post, reply with BBCode, follow the topic, and report a post.
3. Write a review, start a topic, and favourite a character.
4. Travel to Oct 5, 2013 21:00 and confirm that the thread, the score and the opening theme are hidden. Then travel to before your join date and confirm you can't post.

## Screenshot comparison

See [`docs/SCREENSHOT_CHECKLIST.md`](docs/SCREENSHOT_CHECKLIST.md). The images are in `screenshots/`, with renders of the three reference pages in `screenshots/reference/`.

## Project structure

```
app/                     Routes (App Router)
  anime/[id]/[name]/     Profile + tabs: overview, characters, episodes, videos,
                         reviews, recommendations, stats, forum, pics
  anime/season/          Seasonal charts
  forum/                 Index, boards, threads, new topic, report, following
  profile/ animelist/    Member profiles and lists; ownlist/ edits a list entry
  character/ people/ company/ industry/ manga/ news/ search/ community/ stats/
  actions/               Server actions (auth, list, forum, reviews, profile, time)
components/              Site chrome, BBCode renderer, forum and anime components
data/                    Versioned catalogue, reconstructed seed content, and
                         generated/ioe-threads.json (the recovered archive)
lib/
  time.ts                Archive clock, JST and broadcast-day formatting
  catalog.ts             Date-aware catalogue queries
  archive.ts             Recovered threads, members and snapshots
  forum.ts members.ts reviews.ts stats.ts
  bbcode.ts              Parser (tree only, never HTML)
  store/                 Member data: local JSON store and Supabase store
supabase/                Migration and generated seed
scripts/                 Seed generator, reset, screenshots, reference importer
tests/                   Unit tests
```

## Security notes

- BBCode is parsed into a tree and rendered by React, so user text is always escaped. Links allow only `http(s)` and site-relative URLs and get `rel="nofollow ugc noopener"`.
- Input is validated with zod. Posts are capped at 10,000 characters, and replies are rate-limited per member.
- Local mode hashes passwords with scrypt and stores sessions as SHA-256 token hashes in `httpOnly`, `SameSite=Lax` cookies.
- Supabase mode relies on Row Level Security for every member table. Usernames and join dates can't be changed after sign-up, and posts can only be created through the numbering function.
- No credentials or admin accounts are hard-coded.

## Later phases

2014 and later seasons, further Impact of Eden episodes, the Nightpolis Winter details, and admin tooling for editing the catalogue in Postgres are all left for later phases. The data model already carries visibility and provenance on every record, so adding years needs no structural changes.
