# Screenshot comparison checklist

Captured with `npm run screenshots` at 1280px wide (the mobile shot is 390px). Each image uses the archive moment noted below. Reference renders of the original pages are in `screenshots/reference/`.

## Episode discussion pages vs. references

| Element | Reference | Implementation | Match |
| --- | --- | --- | --- |
| Dark YAL header: logo badge, nav, search placeholder "Search anime, manga, users...", gold Go button, 4px gold rule | ep1/ep2/ep3 | All pages | ✅ Same CSS, ported verbatim. Login / Sign Up links added at the right edge. |
| Cream breadcrumb `YourAnimeList » Anime » Impact of Eden (2013) » Episodes » Episode N Discussion` | ✅ | ✅ | ✅ Every crumb links to a real page |
| Teal title bar, "Forum » Anime Discussion » Episode Discussion" | ✅ | ✅ | ✅ |
| Metadata table: Started by YALBot ★MODERATOR, Created, Replies, Views, Last Reply, Status OPEN | ep1: Oct 6 02:31 JST · 1,113 · 42,806 · Oct 9 23:48 by RetroBluRay_AMV | Same at Oct 24, 2013 | ✅ Before the snapshot, Replies is the live count and Views reads "Not recorded for this date" |
| Controls: Reply, Follow Topic, Watch Episode, Anime Page, Episode List, other episode discussions, Sort | Varied slightly per page | One reusable template for all three | ✅ Every button works. ep2/ep3 now also show Anime Page and Episode List. |
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

## Other screens

| Screenshot | Moment | Check |
| --- | --- | --- |
| `04-impact-of-eden.png` | Oct 24, 2013 | Sidebar (cover, list actions, alternative titles, information, statistics, streaming) and tabs Overview · Characters & Staff · Episodes · Videos · Reviews · Recommendations · Stats · Forum. Score 8.51 (2,847 users, archived Oct 6). Ranked N/A. |
| `05-nightpolis-winter-ova.png` | Oct 24, 2013 | Separate OVA record (ID 1043, 2005). Every undocumented field is marked; the relation to the TV series is labelled as undocumented. |
| `06-home.png` | Oct 24, 2013 | Fall 2013 strip, news, latest forum posts, reviews, Airing Next (Ep 4, Sat 25:58), Top Anime, newest members |
| `07-fall-2013.png` | Oct 24, 2013 | Seasonal chart card, studio, broadcast slot, members |
| `08-character-miyuki.png` | Oct 24, 2013 | Biography gated by episode, VA, relationships, discussions |
| `09-forums.png` | Oct 24, 2013 | Board index grouped Anime & Manga / Community / YAL |
| `10-ep1-at-0300.png` | Oct 6, 2013 03:00 JST | Five replies, "Page 1 of 1", views not recorded yet, Episode 2 absent |
| `11-ioe-before-premiere.png` | Oct 5, 2013 21:00 JST | "Not yet aired", no score, no opening theme, no reviews |
| `12-ep1-mobile.png` | Oct 24, 2013 | Single column at 390px; the desktop look is kept, no app-style redesign |

Legend: ✅ matches · ⚠️ deliberate difference · ➕ addition outside the original page
