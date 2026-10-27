@AGENTS.md

# Connected Desktop: working notes

A 2012-2013 style desktop computer that runs in the browser (Next.js 16, React 19, client-only). See `README.md` for running it and `../IMPLEMENTATION_STATUS.md` for status and open questions.

## Commands

- `npm run dev:all`: desktop on 3000 plus YourAnimeList on 3100 (needs `../yal` installed).
- `npm test`: unit tests (`tests/*.test.ts`, Node's test runner with tsx).
- `npm run e2e`: the first-milestone run in Chromium, against a running dev server. Keep it passing.
- `npm run typecheck`, `npm run lint` (0 errors expected), `npm run build`.
- `npm run media`: regenerates `public/media/` and `data/generated/media-manifest.json` (Python 3 with Pillow and NumPy, plus ffmpeg).

## Rules for this phase

- **Impact of Eden is out of scope.** Don't add, mention or link it anywhere in `connected/`. `tests/data.test.ts` fails if its names show up in data or the search index. In `../yal` it is hidden by release-state controls (`yal/data/release.ts`); never delete that material.
- **The Master Bible is the source of truth** (`../docs/bible/Connected_Era_Master_Bible_v1.0.pdf`). Match its names, dates, credits and songs. Where it marks a detail as open or pending, show it as pending instead of inventing one. Names it doesn't cover (Birdie, Tum, HomePlot and friends) are ours and live in `data/`.
- **No fabricated results or dead ends.** Buttons do what they say. If something can't work (for example mail to an outside address), say so plainly in the UI instead of faking success.
- **Never put tokens or API keys in code or data.** Nothing here needs any.
- **Keep the tone warm and relaxed** in all written content (posts, mail, stories, UI copy). No gloomy scenarios.

## Conventions

- **Time:** never use the real clock for content. Use `now()` from `useSystem()` (or `useClock()`), which is clamped to Jul 11, 2012 to Dec 31, 2013 (`lib/time.ts`). Real time is only for things like heartbeats and animation.
- **Availability:** every archive record has dates (`lib/availability.ts`); show it only once `isListed(...)` is true for the computer's time and region. Community posts people make (chirps, guestbook entries, stories...) are also hidden until their `at` date if the clock is moved back.
- **Archive vs. user data:** archive content ships in `data/` and is never written to storage. Records people create go in the store with `origin: "user"` and an `owner` (account id).
- **Storage:** `useSystem().store` (IndexedDB in the browser, `MemoryStore` in tests). Use `useCollection(name)` for live lists (owner-filtered unless `{ allUsers: true }`) and `useUserValue(key, initial)` for per-account settings.
- **IDs:** `newId(prefix)` from `lib/ids.ts`; add new prefixes to `IdPrefix`. Archive records use fixed ids written in the data files.
- **Files:** go through `useSystem().vfs` (`lib/vfs.ts`), never the store directly. Use `FileDialog` from `components/apps/common.tsx` for Open/Save.
- **Programs:** add metadata to `components/apps/catalog.ts` and the component to `components/apps/registry.tsx`. Read window arguments with `useArgs(win, fn)` (runs again when a single-instance program is asked to open something new) and set the title with `useWindowTitle`.
- **Addresses:** every archive site lives under `*.connectedera.local` (hosts in `lib/web/hosts.ts`). Old addresses from before the move (goggle.com, metube.com...) forward to their new home through `upgradeLegacyUrl`.
- **Sites:** add the component under `components/sites/` and register its host in `components/sites/registry.tsx`. Links inside sites use `<A href>` from `SiteContext` so they stay in the browser; set the tab title with `usePageTitle`. Add pages to Connected Search in `data/search-docs.ts` with honest `publishedAt` dates.
- **React lint rules are strict** (React Compiler rules): don't call `setState` synchronously inside effects (tag async results with their source and compare instead), don't read or write refs during render (use `useEffectEvent` for callbacks used inside effects), and don't call `Date.now()` during render.
- **Pure logic goes in `lib/`** with tests; components stay thin.
- Menus that use `position: fixed` must be portalled to `<body>` (windows use `backdrop-filter`, which changes what "fixed" is relative to). `ContextMenu` already does this.
