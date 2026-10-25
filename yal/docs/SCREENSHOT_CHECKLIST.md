# Screenshot comparison checklist

Captured with `npm run screenshots` at 1280px wide (the mobile shot is 390px). Each image uses the archive moment noted below. Reference renders of the original pages are in `screenshots/reference/`.

## Episode discussion pages vs. references

Impact of Eden is held back for a later development phase, so these comparisons refer to the shots kept in `screenshots/future-phase/impact-of-eden/` (recapture them with `NEXT_PUBLIC_LUMINE_FUTURE_PHASES=impact-of-eden`). The same thread template is shown with active content in shots 01, 02, 10, 12 and 16 below.

| Element | Reference | Implementation | Match |
| --- | --- | --- | --- |
| Dark YAL header: logo badge, nav, search placeholder "Search anime, manga, users...", gold Go button, 4px gold rule | ep1/ep2/ep3 | All pages | ✅ Same CSS, ported verbatim. Login / Sign Up links added at the right edge. |
| Cream breadcrumb `YourAnimeList » Anime » Impact of Eden (2013) » Episodes » Episode N Discussion` | ✅ | ✅ | ✅ Every crumb links to a real page |
| Teal title bar, "Forum » Anime Discussion » Episode Discussion" | ✅ | ✅ | ✅ |
| Metadata table: Started by YALBot ★MODERATOR, Created, Replies, Views, Last Reply, Status OPEN | ep1: Oct 6 02:31 JST · 1,113 · 42,806 · Oct 9 23:48 by RetroBluRay_AMV | Same at Oct 24, 2013 | ✅ Before the snapshot, Replies is the live count and Views reads "Not recorded for this date" |
| Controls: Reply, Follow Topic, Watch Episode, Anime Page, Episode List, other episode discussions, Sort | Varied slightly per page | One reusable template | ⚠️ While the Impact of Eden page is planned, Watch Episode and Episode List are hidden and Anime Page opens the coming-soon entry |
| Pagination "Page 1 of 56 « Previous 1 2 3 … 55 56 Next »", top and bottom | ep1 56, ep2 48, ep3 54 | 56 / 48 / 54 at Oct 24 | ✅ |
| Two-column posts: avatar, username, rank, Joined, Posts, Online/Offline; alternating backgrounds | ✅ | ✅ | ✅ Same avatars (sprite copied verbatim) |
| YALBot announcement post (yellow left rule) | ✅ | ✅ | ✅ |
| Quote blocks "Originally posted by X — #N" | ✅ | ✅ | ✅ Free-form quote headers are kept verbatim |
| Spoiler block with Show/Hide | ep1 #14 | ✅ | ✅ Keyboard-operable button with `aria-expanded` |
| Edited notes "Edited Oct 6, 2013, 04:11 JST / Reason: …" | ✅ | ✅ | ✅ |
| Post timestamps in the poster's zone (JST/PDT/GMT/EDT/CET/BRT) | ✅ | ✅ | ✅ |
| QUOTE · REPLY · REPORT links | Decorative | Working | ✅ Quote pre-fills the reply box; Report opens a report form |
| Reply box "Post a Reply", Notify me of replies, Preview, Post Reply | ep1/ep2 (ep3 had "Quick Reply") | One template | ✅ Live BBCode preview, toolbar, Shift+Enter to post |
| Sidebar: Episode Discussion / Quick Links / Active Users Viewing / Hot Subthreads / Other Episodes | ✅ | ✅ | ✅ Snapshot cards appear only after capture. Hot subthreads link to their own (unrecovered) threads. |
| Episode 3 poll | Unstyled in reference | Styled bars | ⚠️ Deliberate improvement; same data (851 votes, 61/26/8/3/2%) |
| "Ep 4 — Not aired yet" | ✅ | ✅ at Oct 24 | ✅ Derived from the documented weekly slot |
| Footer About · Terms · Privacy · Contact · Advertising, © 2013 | Decorative | Real pages | ✅ |
| Archive toolbar above the header | — | New | ➕ Lumine StarWorks time machine, styled outside YAL's own palette |
| Archive note under the sidebar | — | New | ➕ Provenance label (archived / reconstructed / member) |

## Screenshot set (active content)

| Screenshot | Moment | Check |
| --- | --- | --- |
| `01-sinful-apex-finale-thread.png` | Oct 24, 2013 | The episode-thread template with a reconstructed finale thread: metadata table, controls, posts, spoiler, reply box |
| `02-glass-cathedral-finale-thread.png` | Oct 24, 2013 | Same template, another finale thread |
| `03-iron-to-requiem.png` | Jun 1, 2013 | Iron to Requiem mid-season: documented credits, aired episodes, next slot |
| `04-sinful-apex.png` | Oct 24, 2013 | Built-out profile with every tab; established facts kept (Flow Pictures, Aug 15, 2011 – Jan 23, 2012, 24 eps, dir. Kaihatsu Miura, LUNE as Aria Moonbirth) |
| `05-character-nico-vale.png` | Oct 24, 2013 | Character page: biography gated by episode, voice actor, relationships |
| `06-home.png` | Oct 24, 2013 | Home with no Impact of Eden material: news, latest forum posts, reviews, Top Anime, newest members |
| `07-spring-2013.png` | May 1, 2013 | Seasonal chart with Iron to Requiem airing |
| `08-company-flow-pictures.png` | Oct 24, 2013 | Company page with its productions |
| `09-forums.png` | Oct 24, 2013 | Board index grouped Anime & Manga / Community / YAL |
| `10-finale-thread-at-0300.png` | Jan 24, 2012 03:00 JST | The Sinful Apex finale thread half an hour after it opened: only the first replies |
| `11-glass-cathedral-before-premiere.png` | Jan 5, 2012 | "Not yet aired", no score, no opening theme, no reviews |
| `12-thread-mobile.png` | Oct 24, 2013 | Single column at 390px; the desktop look is kept |
| `13-about-the-archive.png` | Oct 24, 2013 | Provenance table and known gaps, with the held-back phase noted |
| `14-vacant-crown.png` | Oct 24, 2013 | Two-cour entry with two opening themes, five-character cast and its finale thread |
| `15-summer-2012.png` | Aug 1, 2012 | Summer 2012 chart while Vacant Crown is airing |
| `16-vacant-crown-finale-thread.png` | Oct 24, 2013 | A reconstructed finale thread using the archived thread template |

Legend: ✅ matches · ⚠️ deliberate difference · ➕ addition outside the original page
