# Connected Desktop

A 2012-2013 style computer that runs in your browser: boot it up, make an account, and you get a desktop with a Start menu, windows, a tabbed web browser, your own files, Messenger, Mail, media players, Paint, games and a whole little web of sites from the era (videos, manga, blogs, forums, fan fiction, homepages and more). Everything you do is saved on your computer and is still there after a restart.

The clock lives in the Connected Era: anywhere from July 11, 2012 to December 31, 2013 (it starts on Saturday, September 7, 2013). Websites only show what had been published by the computer's date, so moving the clock changes what you find.

## Run it

You'll need Node.js 22.13 or newer.

```bash
cd connected
npm install          # also copies the PDF.js worker into public/
npm run dev:all      # desktop on http://localhost:3000, YourAnimeList on http://localhost:3100
```

Open http://localhost:3000, pick a name and a picture, and you're in.

`npm run dev:all` needs YourAnimeList's dependencies too (`cd ../yal && npm install`). To run only the desktop, use `npm run dev`; the browser will then show a friendly note when you visit yal.connectedera.local.

## Things to try

- Double-click **Web Browser**, search Connected Search for "Mochi", and watch a video on MeTube.
- Read a chapter of *Lantern Street Couriers* on MangaShelf (it reads right to left).
- Download a wallpaper from WallpaperGarden, find it in **Computer > Downloads**, right-click it and choose **Set as desktop background**.
- Share a MeTube video with a friend in **Messenger**, or email it from the video page.
- Sign a guestbook on HomePlot, or post a story on InkPocket.
- Install **Star Courier** from Freeware Corner and play it from **Games**.
- Read the latest anime news on AniWire (`aniwire.connectedera.local`), then look the show up on AniFanWiki and fix a page while you're there.
- Open **Radio** from the Start menu and flip between the six stations.
- Subscribe to a few sites in **News Reader** and see what's new.
- Hop into `#anime` in **Relay Chat**. Log in as a second account in another tab and you can chat with yourself.
- Make a photo album on SnapNest, or post something to give away on Corkboard.
- Change the date in **Control Panel > Date and Time** and see which sites, videos and chapters are around.

## Put it online

The desktop and YourAnimeList deploy to Vercel as two projects from this repository; [`../docs/DEPLOY_VERCEL.md`](../docs/DEPLOY_VERCEL.md) walks through it. The only setting the desktop needs is `NEXT_PUBLIC_YAL_ORIGIN`, the address where YAL is served (see `.env.example`).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Desktop only, on port 3000 |
| `npm run dev:all` | Desktop and YourAnimeList together |
| `npm test` | Unit tests (file system, window manager, browser, search, ZIP, mail, Messenger, Relay Chat, radio, News Reader, wiki, games, archive data) |
| `npm run e2e` | Drives the first milestone in Chromium: needs `npm run dev:all` running. Add `--headed` to watch. Screenshots go to `test-results/`. |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run build` | Production build |
| `npm run media` | Regenerates all original media into `public/media/` (needs Python 3 with Pillow and NumPy, and ffmpeg) |
| `npm run index:yal` | Rebuilds the YourAnimeList pages Connected Search knows about, from `../yal/data` |

## Settings

| Variable | Default | Used for |
| --- | --- | --- |
| `NEXT_PUBLIC_YAL_ORIGIN` | `http://localhost:3100` | Where the desktop finds YourAnimeList |
| `NEXT_PUBLIC_YAL_EMBED_ORIGINS` (set on YAL) | `http://localhost:3000,http://127.0.0.1:3000` | Which desktops may show YAL in a frame |

No accounts, keys or outside services are needed: everything runs and is stored locally in your browser (IndexedDB). **Control Panel > About > Reset this computer** erases it all and starts fresh.

## How it's put together

- `components/system/`: the running computer (storage, power, accounts, clock, settings, windows, notifications, downloads).
- `components/desktop/`: boot and login screens, desktop, taskbar, Start menu, window frames, dialogs.
- `components/apps/`: every program, loaded when its window opens. `catalog.ts` lists them and which files they open.
- `components/sites/`: the archive websites, served inside the browser. `registry.tsx` maps addresses to sites.
- `lib/`: logic without React (time, file system, window manager, browser history, search, ZIP, mail, Messenger, games), all covered by tests.
- `data/`: archive content (videos, manga, wallpapers, posts, homepages, fan fiction, news, wiki pages, radio, chat logs, albums, classifieds, mail, contacts) with dates, plus generated media and the YAL index. `catalogue.ts` holds the Master Bible's anime facts that every site shares.
- `scripts/media/`: the Python generators for every picture, video, song, manga page and PDF. All media is original.

See `../IMPLEMENTATION_STATUS.md` for what's done, what's partly done and the open questions.
