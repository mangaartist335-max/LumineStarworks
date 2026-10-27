# Implementation status: The Connected Era

_Last updated: development phase 1 (Connected Desktop, Summer 2012 to December 2013)._

This repository holds three separate apps:

| Folder | What it is | Port |
| --- | --- | --- |
| `connected/` | **Connected Desktop**: a 2012-2013 style computer that runs in the browser, with its own web archive, programs and games | 3000 |
| `yal/` | **YourAnimeList (YAL)**: the anime database and forums, shown inside the desktop's browser | 3100 |
| repo root | BuildBrief (an unrelated earlier project, untouched) | 3000 when run alone |

Start the Connected Era with `cd connected && npm install && npm run dev:all`, then open http://localhost:3000. See `connected/README.md` for details.

## Scope for this phase

**Impact of Eden is held back.** Nothing about it is built or featured in this phase, and nothing was deleted:

- In YAL, every Impact of Eden record (anime, characters, people, companies, news, threads, posts, reviews, recommendations, archive threads, screenshots) is tagged with a `phase` and hidden by `yal/data/release.ts`. Turning on `NEXT_PUBLIC_LUMINE_FUTURE_PHASES=impact-of-eden` brings it all back. YAL's tests check both states.
- The desktop's data has no Impact of Eden material at all. `connected/tests/data.test.ts` scans every data file, the search index and the YAL index to keep it that way.

## How it was checked

All results below are from this phase's final runs.

| Check | Command | Result |
| --- | --- | --- |
| Desktop unit tests | `cd connected && npm test` | 48 passed, 0 failed |
| Desktop typecheck | `npm run typecheck` | clean |
| Desktop lint | `npm run lint` | 0 errors, 20 style warnings (comma-expression shorthands and `<img>` for local pictures) |
| Desktop production build | `npm run build` | succeeds |
| First milestone, end to end | `npm run e2e` (with `npm run dev:all` running) | all 19 steps pass with no console errors |
| Milestone on production builds, set up like the Vercel deployment | YAL built with `NEXT_PUBLIC_YAL_EMBED_ORIGINS=http://localhost:3300/` on port 3400, the desktop built with `NEXT_PUBLIC_YAL_ORIGIN=http://localhost:3400/` on port 3300, then `BASE_URL=http://localhost:3300 YAL_URL=http://localhost:3400 npm run e2e` | all 19 steps pass with no console errors, including YAL inside the desktop's browser |
| YAL unit tests | `cd yal && npm test` | 56 passed, 0 failed |
| YAL typecheck | `cd yal && npx tsc --noEmit` | clean |

The milestone test (`connected/scripts/e2e.cjs`) drives a real Chromium through: launch the desktop, open the browser, search MeTube, play a video (checks it is really playing), open a second tab, search MangaShelf, read to page 3, download a wallpaper, find it in Downloads, set it as the background, open Messenger, share the MeTube link, close everything, restart, and confirm that the bookmark, the downloaded file, the messages, the reading progress and the wallpaper are all still there. It then relaunches the whole browser on the same profile and checks again, exercises window controls (drag, resize, minimize, maximize, switch), posts on three community sites and opens YAL inside the browser.

## Feature status

Legend: **Done** works end to end and persists. **Partly done** works, with the limits listed. **Not built** is not in this phase.

### Desktop

| Feature | Status | Notes |
| --- | --- | --- |
| Boot, login and account setup | Done | Boot screen, Welcome screen, multiple local accounts, optional passwords (salted PBKDF2, stored locally). A single account without a password logs straight in. |
| Desktop icons, wallpaper, Start menu, taskbar | Done | Start menu search opens programs, files or a web search. Taskbar shows pinned and open programs. |
| Clock, calendar, notification area | Done | Calendar flyout, volume, network and Messenger status in the tray. Toast notifications for downloads, mail, messages and achievements. |
| Windows | Done | Open, focus, drag, resize from any edge, minimize, maximize (also by dragging to the top), restore, close, switch from the taskbar. |
| Shut down, restart, log off | Done | Restart reboots and logs back in; interrupted downloads come back as "failed" with Retry. |
| Persistent preferences | Done | Wallpaper, fit, window colour, volume, browser settings, view choices, game settings. All stored in IndexedDB. |
| Control Panel | Done | Personalization, date and time (anywhere from Jul 11, 2012 to Dec 31, 2013), time zone, region, user accounts, connection speed, About, restore defaults, reset the computer. |
| Desktop icons rearranged by dragging | Not built | Icons sit in a fixed column. |

### Files and programs

| Feature | Status | Notes |
| --- | --- | --- |
| Shared file system | Done | Desktop, Downloads, My Documents, My Pictures, My Music, My Videos and Recycle Bin per account, with sample files like a new PC. |
| Explorer | Done | Back, forward, up, breadcrumbs, search, details and icon views, sorting, new folder, cut, copy, paste, rename, delete, restore, empty Recycle Bin, drag files onto folders, open with the right program. Shows downloads in progress with Retry. |
| Downloads | Done | Real fetches, throttled to the chosen connection speed (dial-up to unlimited), with progress, cancel, retry and open. |
| Photo Viewer | Done | Zoom, fit, actual size, rotate, previous and next, slide show, delete, set as desktop background. |
| Music Player | Done | Every song on the computer, playlists (create, rename, reorder, delete), shuffle, repeat, seek, volume, visualizer. |
| Video Player | Done | Plays videos from your folders with the rest of the folder lined up next. |
| Notepad | Done | Open, save, save as, find, word wrap, text size, time stamp. |
| Paint | Done | Pencil, brush, eraser, fill, colour picker, text, line, rectangle, ellipse, select and crop, resize, rotate, flip, undo and redo, save PNG, set as background. |
| Archive Manager | Done | Open ZIP and CBZ, extract all or selected, open a file from inside, create ZIP files from files and folders. Uses a ZIP reader and writer built for this project (deflate via the browser's CompressionStream). |
| PDF Reader | Done | Renders with PDF.js: page navigation, zoom, fit width, continuous scrolling. |
| Calculator | Done | Standard calculator with memory keys and keyboard input. |
| Radio | Done | The Bible's six stations (CV Pop FM, Garage Noise 101.7, Ambient Echo, TalkWave AM, Pixel Beats and Golden Oldies) with 27 programmes on their own schedules. Tuning in follows the computer's clock, so you join mid-song, and a station only plays songs and adverts that exist by that date. The songs, station idents, adverts and DJ links are original and generated (the DJs are synthesized voices). Keeps playing while minimized. |
| News Reader | Done | Follow sites through 22 RSS feeds (AniWire, Flow Pictures, wiki recent changes, MangaShelf, InkPocket, TechNook, MeTube channels and Tum blogs). Refreshing fetches into an offline cache, with unread counts, folders and a fetch history. Items only arrive once their date has come. |

### Web

| Feature | Status | Notes |
| --- | --- | --- |
| Tabbed browser | Done | Tabs, address bar, back, forward, reload, home, bookmarks and bookmarks bar, history, downloads page, preferences, session restore, new tab page, keyboard shortcuts (Ctrl+T, W, L, D, H, J, R, N, Tab). |
| Live websites | Done | Any address outside the archive gets a clear "live website, not part of the archive" page with a button to open today's site in your real browser. Nothing live is ever shown as a 2012-2013 page. |
| Connected Search | Done | Ranked results with titles, descriptions and highlighted snippets, suggestions, image and video search, pagination, date filters, search history and typing an address to go straight there. 311 indexed pages, each shown only once its publication date has passed. |
| Addresses | Done | Every site lives under `*.connectedera.local`, a reserved name that can't clash with a real website. Old addresses from early builds (goggle.com, metube.com and friends) forward to their new home, and mistyped archive addresses get a friendly "no such site" page. |
| MeTube | Done | Home and featured videos, search, channels, subscriptions, real playback (play, pause, seek, volume, full screen, progress), comments, likes, favourites, playlists, history, uploads from your computer, view counts and upload dates, related videos. 17 original videos across 13 channels (gaming, pets, music, tutorials, sports, editing, desktop customization, vlogs, anime commentary). Four of the channels are the creators the Master Bible names (XXICEBURNERXX, HEARTCORE_ANGEL, NOOBDESTROYER92 and STRAWBERRY_STATIC); their videos are labelled on the watch page as constructed reconstructions. Archive videos and your uploads are kept apart. |
| MangaShelf | Done | Browse, search by title, author or genre, title pages, dated chapters, right-to-left and left-to-right reading, zoom, full screen, page bookmarks, progress and continue reading, favourites, history, import from images or a CBZ/ZIP. 3 original series, 5 chapters. |
| WallpaperGarden | Done | 8 original wallpapers with dates, categories and downloads. |
| AniWire | Done | Anime news, features, reviews and an interview: 11 articles, each with its corrections and reader comments on their own dates. Leave your own comments (shared by every account on the computer). Show facts come from the Master Bible. |
| Flow Pictures | Done | The studio's official site: news posts on the dates the Bible records, the 18-title works catalogue, the staff registry and LUNE's songs, with links to YourAnimeList and the wiki. |
| AniFanWiki | Done | An anime encyclopedia anyone can edit: 37 starting pages whose 74 revisions unfold with the computer's date. Edit and create pages in wiki markup, preview, view history and line-by-line diffs, restore older versions, recent changes, search and spoiler tags. Gaps the Bible leaves open are stated on the pages, never filled in. |
| YourAnimeList | Done | Shown inside the browser in a frame (embed mode keeps it in sync with the address bar). Needs `npm run dev:all`. |
| Birdie, Tum, 3Chan, TechNook | Done | Microblog (follow, like, reply), blogs and fan art (reblog, notes, tags, your own customizable blog), anonymous boards (threads, replies, quotes, pictures) and forums (threads, quotes, signatures). |
| HomePlot | Done | Personal homepages with dated updates, hit counters and guestbooks. Sign any guestbook, and make and edit your own page. |
| InkPocket | Done | Fan fiction for the era's original manga and Star Courier: chapters, reviews, favourites, continue reading, and posting your own stories chapter by chapter. |
| SnapNest | Done | Photo albums: 3 starting albums from around town, plus your own albums (public, unlisted with a share link, or private) with uploads from your files, tags, a slideshow and downloads. |
| Corkboard | Done | Town classifieds: 16 listings (for sale, free, wanted, swap, services, events) that close when sold, claimed or finished. Post your own, mark it sold, and message sellers who have an account on this computer. No payments happen here, and the site says so. |
| Small sites | Done | Freeware Corner (where Star Courier installs from), Pantry Recipes and ConnectMail's home page. |

### People

| Feature | Status | Notes |
| --- | --- | --- |
| Messenger | Partly done | Contacts, statuses and personal messages, one-to-one and group chats, timestamps, history, typing indicators, emoticons, nudges, profile pictures, unread counts, notifications and links that open in the browser. Chats between accounts on this computer are real, including across two browser tabs. The six sample contacts (Dana, Sky, Nadia, Akira, Olivia, Tom) answer with **scripted, clearly labelled automatic replies** and keep their own online hours; they are not people. |
| Relay Chat | Done | IRC-style client for `irc.connectedera.local`: 5 channels with the regulars' scrollback, live chat between every account on this computer (including across tabs), nicknames, topics, `/me`, private messages, away messages, channel operators who can set topics and kick, and logs saved as plain text. The regulars appear only in the scrollback, so nobody pretends to be online. |
| Mail | Partly done | Inbox, compose, reply, reply all, forward, drafts that save themselves, sent, archive, deleted, custom folders, attachments from your files, saving attachments, search, unread state. Mail between accounts on this computer is delivered for real. Sample contacts send a labelled automatic reply. Any other address bounces with a delivery report, because there is no outside mail server. A welcome note and a few friendly messages arrive after an account is created; newsletters arrive on their dates. |

### Games

| Feature | Status | Notes |
| --- | --- | --- |
| Games launcher | Done | Installed games, install from Freeware Corner (only once a game has come out on the computer's clock), uninstall, launch history, saves, high scores and achievements, sound setting. |
| Field Sweeper | Done | Three difficulties, safe first click, flags, chording, timer, best times, 3 achievements. |
| Star Courier | Done | Original arcade game: fly, collect parcels, dodge rocks, beat the level 4 boss. Pause, three save slots plus autosave, high scores, 5 achievements. |

### Time and data

| Feature | Status | Notes |
| --- | --- | --- |
| Timeline | Done | The clock runs from a chosen moment between July 11, 2012 and December 31, 2013 (default Saturday September 7, 2013, 4 PM Eastern). Every archive record has availability data (published, created, region, status, removed) and appears only from its date. |
| Archive vs. your data | Done | Archive content ships in the code and is never written to storage. Everything people make is stored with `origin: "user"` and kept separate. |
| Cross-app links | Done | Downloads land in Explorer, pictures become wallpapers, MeTube shares to Messenger and Mail, Mail attachments save to Downloads, Explorer sends files to Mail and Archive Manager, Freeware Corner installs into Games, links in chats and mail open in the browser. |

## Blockers and open questions

These need a decision or material from outside this repository:

1. **The Master Bible is now in the repository** (`docs/bible/Connected_Era_Master_Bible_v1.0.pdf`). Every site has moved to `*.connectedera.local` and the search engine is Connected Search, as Appendix D asks. Old addresses forward automatically. Names the Bible doesn't cover (Birdie, Tum, 3Chan, TechNook, HomePlot, InkPocket, MangaShelf, WallpaperGarden, Freeware Corner, Pantry Recipes and the sample contacts) are still our own and live in data files.
2. **YAL now follows the Bible's catalogue.** All 18 Flow Pictures titles from chapter 18 (Rust Veil Junction included) are listed with their year, format, description, registry staff and LUNE's songs. Ghost Eater, Destiny/Infinite, A Mystical Skyline/Finger and Azure Sorcerer have title entries only. The Bible doesn't record episode titles, casts, air dates or most studio credits for these, so they show as pending rather than being made up. The earlier reconstructed casts, characters and episode lists were removed to match.
3. **MunchyRoll and the AdultDrift guide aren't built.** The Bible gives no 2012-2013 catalogue or schedule for either outside the held-back Impact of Eden material, and there are no licensed episodes to stream. They're ready to build as soon as a catalogue or schedule for this period is decided. YourAnimeList still lists both companies.
4. **No outside services.** Everything runs locally in the browser. There are no server-side accounts, no syncing between devices and no real email; that is intentional for this phase. No API keys or tokens are used anywhere.

## Known limits

- Everything is stored in the browser's IndexedDB on one device. Clearing site data, or Control Panel > About > Reset this computer, erases it.
- Videos are WebM (VP9 and Opus) and music is MP3, which play in current Chrome, Edge and Firefox. Older Safari versions may not play the WebM videos.
- The desktop is designed for screens 1024 pixels wide and up. On narrow screens, windows open maximized.
- YAL in the browser frame needs both servers (`npm run dev:all`). If the desktop is served from another origin, add it to YAL's `NEXT_PUBLIC_YAL_EMBED_ORIGINS`.
- Messages from another account only arrive in real time while that account is logged on in some tab. Otherwise they are waiting next time.
- Remaining lint warnings are style-only (no errors).

## Where things are

- `connected/README.md`: running, testing and regenerating media.
- `connected/CLAUDE.md`: conventions for working on the desktop.
- `yal/README.md`: YourAnimeList, including the release-state controls.
- `docs/DEPLOY_VERCEL.md`: putting the desktop and YAL online as two Vercel projects.
