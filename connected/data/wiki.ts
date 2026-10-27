// AniFanWiki's starting pages. Article text is built from data/catalogue.ts
// (the Master Bible), and each page has a revision history that unfolds with
// the computer's date. Gaps the Bible leaves open are stated on the pages
// ("haven't been added yet"), never filled in. The editors are the wiki's
// own volunteers.

import { HOST } from "@/lib/web/hosts";
import { titleToPath, type Revision } from "@/lib/wiki";
import { catalogue, FORMAT_LABEL, IRON_TO_REQUIEM, LUNE, olderCredits, people, personBySlug, titleBySlug, yalAnimeUrl, yalPersonUrl, type CatalogueTitle } from "./catalogue";

export const WIKI_HOST = HOST.wiki;
export const WIKI_NAME = "AniFanWiki";
export const wikiUrl = (title: string, params?: Record<string, string>) => {
  const q = new URLSearchParams(params).toString();
  return `http://${WIKI_HOST}/wiki/${titleToPath(title)}${q ? `?${q}` : ""}`;
};

export interface InfoboxRow {
  label: string;
  value: string;
  href?: string;
  /** Shown only from this date (when it became known) and/or until another. */
  from?: string;
  until?: string;
}

export interface WikiPage {
  title: string;
  /** Only administrators can edit protected pages. */
  protected?: boolean;
  infobox?: { heading: string; rows: InfoboxRow[] };
  revisions: Revision[];
  talk?: TalkPost[];
}

export interface TalkPost {
  at: string;
  author: string;
  text: string;
}

const EDITORS = ["Chronicler_Kei", "TowerArchivist", "MapleLeafWiki", "sakuga_sunday", "citadel_skies", "rainynight_radio"];
const day = (iso: string, plus: number) => new Date(Date.parse(iso) + plus * 86400_000).toISOString();

let revCount = 0;
function rev(title: string, at: string, editor: string, summary: string, text: string): Revision {
  revCount++;
  return { id: `wr_${revCount.toString().padStart(3, "0")}`, title, at, editor, summary, text };
}

// How a format reads in a sentence.
const KIND: Record<CatalogueTitle["format"], string> = { TV: "TV series", Film: "film", OVA: "OVA", "TV special": "TV special" };
const SHAPED: Record<string, string> = {
  "1 cour": "one-cour TV series",
  "2 cours": "two-cour TV series",
  "split 2 cours": "split two-cour TV series",
  "24 episodes": "24-episode TV series",
  "with an OVA": "TV series with an OVA",
  "OVA trilogy": "OVA trilogy",
};
const kindOf = (t: CatalogueTitle) => (t.shape && SHAPED[t.shape]) || KIND[t.format];

const intro = (t: CatalogueTitle) => `'''${t.title}''' is a ${kindOf(t)} from ${t.years} in the catalogue of [[Flow Pictures]].`;

function staffLines(slugs: string[]): string {
  return slugs.map((s) => personBySlug(s)!).map((p) => `* [[${p.name}]]: ${p.role.toLowerCase()}`).join("\n");
}

function titleText(t: CatalogueTitle, full: boolean): string {
  const parts = [intro(t), "", "== Overview ==", t.description];
  if (full && t.staff.length) parts.push("", "== Staff ==", staffLines(t.staff));
  if (full && t.song) parts.push("", "== Music ==", `* "${t.song}" by [[LUNE]]. Whether it plays as an opening, ending or insert song hasn't been recorded yet.`);
  if (full && t.related?.length) parts.push("", "== Related ==", ...t.related.map((r) => `* ${r.label}: [[${titleBySlug(r.slug)!.title}]]`));
  parts.push("", "== Missing information ==", "This article is a stub. Episode titles, cast and air dates haven't been added yet. If you have a reliable source, please help expand it!");
  if (full) parts.push("", "== External links ==", `* [${yalAnimeUrl(t)} ${t.title} on YourAnimeList]`);
  return parts.join("\n");
}

/** When the wiki first wrote about a title: never before the year it came out. */
function createdAt(t: CatalogueTitle, i: number): string {
  if (t.year <= 2008) return day("2009-04-02T12:00:00Z", i * 3);
  if (t.year === 2012) return "2012-12-29T12:00:00Z";
  return day(`${t.year}-12-01T12:00:00Z`, i % 10);
}

function titleInfobox(t: CatalogueTitle): WikiPage["infobox"] {
  const rows: InfoboxRow[] = [
    { label: "Format", value: t.shape ? `${FORMAT_LABEL[t.format]} (${t.shape})` : FORMAT_LABEL[t.format] },
    { label: "Released", value: t.years },
  ];
  if (t.studio) rows.push({ label: "Studio", value: t.studio, href: wikiUrl(t.studio) });
  for (const s of t.staff) {
    const p = personBySlug(s)!;
    rows.push({ label: p.role, value: p.name, href: wikiUrl(p.name) });
  }
  if (t.song) rows.push({ label: "Song", value: `"${t.song}" (LUNE)`, href: wikiUrl("LUNE") });
  rows.push({ label: "YourAnimeList", value: "Entry", href: yalAnimeUrl(t) });
  return { heading: t.title, rows };
}

const sinful = titleBySlug("sinful-apex")!;
const SINFUL_LIVE = "2011-08-16T03:00:00Z";
const SINFUL_DONE = "2012-01-24T03:00:00Z";
const ITR_PAGE = "2013-04-04T07:00:00Z";
const ITR_DONE = "2013-09-27T02:00:00Z";

const titlePages: WikiPage[] = catalogue
  .filter((t) => t.slug !== "sinful-apex")
  .map((t, i) => {
    const created = createdAt(t, i);
    const expanded = t.year === 2012 ? day("2013-01-15T12:00:00Z", i % 7) : day(created, 120 + (i % 30));
    return {
      title: t.title,
      infobox: titleInfobox(t),
      revisions: [rev(t.title, created, EDITORS[i % EDITORS.length], "New page", titleText(t, false)), rev(t.title, expanded, EDITORS[(i + 2) % EDITORS.length], "Added staff, music and links", titleText(t, true))],
    };
  });

const sinfulBase = (finished: boolean) =>
  [
    finished
      ? `'''Sinful Apex''' is a TV series by [[Flow Pictures]]. It aired every Monday from August 15, 2011 to January 23, 2012, for 24 episodes, and is the studio's final marquee production.`
      : `'''Sinful Apex''' is a TV series by [[Flow Pictures]]. It premiered on August 15, 2011 and airs on Mondays.`,
    "",
    "== Staff ==",
    staffLines(sinful.staff),
    "",
    "== Cast ==",
    "* [[LUNE]] appears as the singer Aria Moonbirth.",
    "",
    "== Missing information ==",
    "Episode titles, the rest of the cast and the theme songs haven't been added yet. See the talk page before adding them.",
    "",
    "== External links ==",
    `* [${yalAnimeUrl(sinful)} Sinful Apex on YourAnimeList]`,
  ].join("\n");

const sinfulPage: WikiPage = {
  title: "Sinful Apex",
  infobox: {
    heading: "Sinful Apex",
    rows: [
      { label: "Format", value: "TV series" },
      { label: "Studio", value: "Flow Pictures", href: wikiUrl("Flow Pictures") },
      { label: "Premiered", value: "August 15, 2011", until: SINFUL_DONE },
      { label: "Aired", value: "Aug 15, 2011 – Jan 23, 2012", from: SINFUL_DONE },
      { label: "Episodes", value: "24", from: SINFUL_DONE },
      ...sinful.staff.map((s) => ({ label: personBySlug(s)!.role, value: personBySlug(s)!.name, href: wikiUrl(personBySlug(s)!.name) })),
      { label: "Featuring", value: "LUNE as Aria Moonbirth", href: wikiUrl("LUNE") },
      { label: "YourAnimeList", value: "Entry", href: yalAnimeUrl(sinful) },
    ],
  },
  revisions: [
    rev("Sinful Apex", SINFUL_LIVE, "Chronicler_Kei", "New page: premiered yesterday", sinfulBase(false)),
    rev("Sinful Apex", SINFUL_DONE, "TowerArchivist", "Finished airing: 24 episodes", sinfulBase(true)),
    rev(
      "Sinful Apex",
      "2013-10-07T10:00:00Z",
      "MapleLeafWiki",
      "Blu-ray release",
      sinfulBase(true).replace("== Missing information ==", "== Home video ==\nFunmaxation is releasing a Complete Collection on Blu-ray on November 19, 2013.\n\n== Missing information =="),
    ),
  ],
  talk: [
    { at: "2012-01-25T11:00:00Z", author: "Chronicler_Kei", text: "Does anyone have a reliable source for the episode titles? I'm leaving them out until we do, so we don't add anything made up." },
    { at: "2012-01-26T09:30:00Z", author: "TowerArchivist", text: "Agreed. Same for the cast list beyond Aria Moonbirth. Better a short page than a wrong one!" },
  ],
};

/** The Flow Pictures page grows as titles come out. */
function flowText(through: number, finished: boolean): string {
  const list = catalogue.filter((t) => t.year <= through);
  return [
    `'''Flow Pictures''' is a Japanese animation studio. Its catalogue runs from [[Vacant Crown: Liminal War]] (2000)${through >= 2001 ? ` to [[${list[list.length - 1].title}]] (${list[list.length - 1].years})` : ""}.`,
    finished ? "\n[[Sinful Apex]] (2011–2012) is the studio's final marquee production." : "",
    "",
    "== Catalogue ==",
    "This list follows the studio's catalogue. It isn't a list of which studio animated each title.",
    ...list.map((t) => `* [[${t.title}]] (${t.years}, ${KIND[t.format]})`),
    "",
    "== People ==",
    "Staff whose names appear across the catalogue include " + people.map((p) => `[[${p.name}]]`).join(", ") + ".",
    "",
    "== Music ==",
    "Singer [[LUNE]] has sung for several Flow Pictures productions.",
  ]
    .filter((l, i, all) => !(l === "" && all[i - 1] === ""))
    .join("\n");
}

const flowPage: WikiPage = {
  title: "Flow Pictures",
  infobox: {
    heading: "Flow Pictures",
    rows: [
      { label: "Type", value: "Animation studio" },
      { label: "Country", value: "Japan" },
      { label: "Final marquee production", value: "Sinful Apex", href: wikiUrl("Sinful Apex"), from: SINFUL_DONE },
      { label: "Website", value: "flowpictures.connectedera.local", href: `http://${HOST.flow}/` },
    ],
  },
  revisions: [
    rev("Flow Pictures", "2009-04-01T12:00:00Z", "Chronicler_Kei", "New page", flowText(2008, false)),
    rev("Flow Pictures", "2010-01-05T12:00:00Z", "MapleLeafWiki", "Added the 2009 titles", flowText(2009, false)),
    rev("Flow Pictures", "2011-01-05T12:00:00Z", "MapleLeafWiki", "Added the 2010 titles", flowText(2010, false)),
    rev("Flow Pictures", "2011-12-02T12:00:00Z", "TowerArchivist", "Added the 2011 titles", flowText(2011, false)),
    rev("Flow Pictures", SINFUL_DONE, "TowerArchivist", "Sinful Apex has finished", flowText(2011, true)),
    rev("Flow Pictures", "2012-12-29T13:00:00Z", "citadel_skies", "Added Rust Veil Junction and Black Aegis", flowText(2012, true)),
  ],
  talk: [{ at: "2012-12-30T10:00:00Z", author: "citadel_skies", text: "Should Black Aegis go under Skyfall Chronicle or get its own page? I gave it its own page and linked the two both ways. Happy to change it!" }],
};

const peoplePages: WikiPage[] = people.map((p, i) => {
  const works = p.works.map((w) => `* [[${w}]]`).join("\n");
  const created = day("2010-02-03T12:00:00Z", i * 4);
  return {
    title: p.name,
    infobox: { heading: p.name, rows: [{ label: "Role", value: p.role }, { label: "YourAnimeList", value: "Profile", href: yalPersonUrl(p) }] },
    revisions: [
      rev(p.name, created, EDITORS[(i + 1) % EDITORS.length], "New page", `'''${p.name}''' works in anime (${p.role.toLowerCase()}).\n\n== Credits ==\n${works}`),
      rev(p.name, day(created, 60), EDITORS[(i + 3) % EDITORS.length], "Added a link", `'''${p.name}''' works in anime (${p.role.toLowerCase()}).\n\n== Credits ==\n${works}\n\n== External links ==\n* [${yalPersonUrl(p)} ${p.name} on YourAnimeList]`),
    ],
  };
});

const olderPages: WikiPage[] = olderCredits.map((o, i) => {
  const credit = o.staff.map((s) => personBySlug(s)!).map((p) => ` It is among the credits of [[${p.name}]] (${p.role.toLowerCase()}).`).join("");
  return {
    title: o.title,
    infobox: { heading: o.title, rows: [{ label: "Released", value: "Not recorded yet" }, { label: "YourAnimeList", value: "Entry", href: yalAnimeUrl(o) }] },
    revisions: [rev(o.title, day("2010-03-01T12:00:00Z", i * 5), EDITORS[i % EDITORS.length], "New page", `'''${o.title}''' is an older anime production.${credit}\n\n== Missing information ==\nIts year, format, studio and broadcast details haven't been recorded yet.\n\n== External links ==\n* [${yalAnimeUrl(o)} ${o.title} on YourAnimeList]`)],
  };
});

const luneSongs = LUNE.songs.map((s) => `* "${s.song}" for [[${s.title}]]`).join("\n");
const lunePage: WikiPage = {
  title: "LUNE",
  infobox: {
    heading: "LUNE",
    rows: [
      { label: "Real name", value: LUNE.realName },
      { label: "Debut", value: "2006, at age 13" },
      { label: "Known for", value: "Aria Moonbirth in Sinful Apex", href: wikiUrl("Sinful Apex"), from: SINFUL_LIVE },
      { label: "YourAnimeList", value: "Profile", href: yalPersonUrl(LUNE) },
    ],
  },
  revisions: [
    rev("LUNE", "2010-03-10T12:00:00Z", "rainynight_radio", "New page", "'''LUNE''' (Lena Moonlight) is an independent singer-songwriter. She debuted professionally in 2006, at age 13, and has sung for several [[Flow Pictures]] productions."),
    rev("LUNE", "2011-09-01T12:00:00Z", "rainynight_radio", "Sinful Apex role", "'''LUNE''' (Lena Moonlight) is an independent singer-songwriter. She debuted professionally in 2006, at age 13, and has sung for several [[Flow Pictures]] productions.\n\nShe appears as the singer Aria Moonbirth in [[Sinful Apex]]."),
    rev("LUNE", "2012-03-16T12:00:00Z", "sakuga_sunday", "Added songs", `'''LUNE''' (Lena Moonlight) is an independent singer-songwriter. She debuted professionally in 2006, at age 13, and has sung for several [[Flow Pictures]] productions.\n\nShe appears as the singer Aria Moonbirth in [[Sinful Apex]].\n\n== Songs ==\nSongs credited to LUNE in the Flow Pictures catalogue. Whether each one is an opening, ending or insert song hasn't been recorded yet.\n${luneSongs}\n\n== External links ==\n* [${yalPersonUrl(LUNE)} LUNE on YourAnimeList]`),
  ],
};

const itrText = (stage: 0 | 1 | 2) =>
  [
    stage === 2
      ? "'''Iron to Requiem''' is a TV series by [[CHAOS Home]]. Its first season aired every Thursday from April 4 to September 26, 2013, for 26 episodes."
      : "'''Iron to Requiem''' is a TV series by [[CHAOS Home]]. It premiered on Thursday, April 4, 2013, with 26 episodes planned.",
    stage === 1 ? "\nIt is currently airing on Thursdays." : "",
    "",
    "== Staff ==",
    "* [[Hiroyuki Sawano]]: music",
    "",
    "== External links ==",
    `* [${yalAnimeUrl(IRON_TO_REQUIEM)} Iron to Requiem on YourAnimeList]`,
  ]
    .filter((l, i, all) => !(l === "" && all[i - 1] === ""))
    .join("\n");

const itrPage: WikiPage = {
  title: "Iron to Requiem",
  infobox: {
    heading: "Iron to Requiem",
    rows: [
      { label: "Format", value: "TV series" },
      { label: "Studio", value: "CHAOS Home", href: wikiUrl("CHAOS Home") },
      { label: "Premiered", value: "April 4, 2013", until: ITR_DONE },
      { label: "Episodes", value: "26 planned", until: ITR_DONE },
      { label: "Aired", value: "Apr 4 – Sep 26, 2013", from: ITR_DONE },
      { label: "Episodes", value: "26", from: ITR_DONE },
      { label: "Music", value: "Hiroyuki Sawano", href: wikiUrl("Hiroyuki Sawano") },
      { label: "YourAnimeList", value: "Entry", href: yalAnimeUrl(IRON_TO_REQUIEM) },
    ],
  },
  revisions: [
    rev("Iron to Requiem", ITR_PAGE, "thursday_club", "New page: premiered today", itrText(0)),
    rev("Iron to Requiem", "2013-06-20T12:00:00Z", "MapleLeafWiki", "Still airing", itrText(1)),
    rev("Iron to Requiem", ITR_DONE, "thursday_club", "Season one has finished", itrText(2)),
  ],
  talk: [{ at: "2013-09-28T09:00:00Z", author: "thursday_club", text: "Season one is done! Thanks everyone who kept this page tidy every Thursday." }],
};

const smallPages: WikiPage[] = [
  {
    title: "CHAOS Home",
    infobox: { heading: "CHAOS Home", rows: [{ label: "Type", value: "Animation studio" }] },
    revisions: [rev("CHAOS Home", ITR_PAGE, "thursday_club", "New page", "'''CHAOS Home''' is a Japanese animation studio. It made [[Iron to Requiem]] (2013).")],
  },
  {
    title: "Hiroyuki Sawano",
    infobox: { heading: "Hiroyuki Sawano", rows: [{ label: "Role", value: "Composer" }] },
    revisions: [rev("Hiroyuki Sawano", ITR_PAGE, "thursday_club", "New page", "'''Hiroyuki Sawano''' is a composer. He wrote the music for [[Iron to Requiem]].")],
  },
];

const mainText = (articles: string) =>
  [
    `Welcome to '''${WIKI_NAME}''', the anime encyclopedia anyone can edit! ${articles}`,
    "",
    "== Start here ==",
    "* [[Flow Pictures]] and its whole catalogue",
    "* [[LUNE]], the singer behind so many Flow Pictures songs",
    "* [[Kaihatsu Miura]], [[Keito Kisaragi]] and the rest of the staff",
    "",
    "== Helping out ==",
    "Every article has an edit tab and a talk page. Please only add what you can back up with a reliable source. A short, correct page beats a long, guessed one!",
    "New to editing? Have a look at [[Help:Editing]].",
  ].join("\n");

const helpText = [
  "Editing a page is easy. Click '''Edit''', change the text, add a short summary and click '''Save page'''.",
  "",
  "== Formatting ==",
  "* Headings: == Heading == or === Smaller heading ===",
  "* Bold and italic: '''bold''' and ''italic''",
  "* Links to other articles: [[Flow Pictures]] or [[Flow Pictures|the studio]]",
  "* Links to other websites: [http://yal.connectedera.local/ YourAnimeList]",
  "* Lists: start a line with an asterisk and a space",
  "* Spoilers: {{spoiler|text}} hides text until a reader clicks it. Example: {{spoiler|this was hidden}}",
  "",
  "== History and talk ==",
  "Every save is kept in the page's history. You can compare any two versions or restore an older one. Use the talk page to discuss changes with other editors.",
  "",
  "== Protected pages ==",
  "A few pages, like this one and the Main Page, can only be edited by administrators. Suggest changes on their talk pages.",
].join("\n");

const sitePages: WikiPage[] = [
  {
    title: "Main Page",
    protected: true,
    revisions: [
      rev("Main Page", "2009-04-01T10:00:00Z", "Chronicler_Kei", "Welcome!", mainText("We're just getting started.")),
      rev("Main Page", "2012-09-01T10:00:00Z", "Chronicler_Kei", "Refreshed the welcome", mainText("Pull up a chair and start reading.")),
    ],
    talk: [{ at: "2012-09-02T15:00:00Z", author: "MapleLeafWiki", text: "Love the new welcome. Maybe a featured article section one day?" }],
  },
  { title: "Help:Editing", protected: true, revisions: [rev("Help:Editing", "2009-04-01T11:00:00Z", "Chronicler_Kei", "Editing help", helpText)] },
];

export const wikiPages: WikiPage[] = [...sitePages, flowPage, sinfulPage, ...titlePages, ...olderPages, lunePage, ...peoplePages, itrPage, ...smallPages];
export const wikiRevisions: Revision[] = wikiPages.flatMap((p) => p.revisions);
export const wikiPageByTitle = (title: string) => wikiPages.find((p) => p.title.toLowerCase() === title.toLowerCase());

/** Infobox rows known by `now` (some only appear once a show has finished, say). */
export function infoboxRowsAt(page: WikiPage | undefined, now: number): InfoboxRow[] {
  return (page?.infobox?.rows ?? []).filter((r) => (!r.from || Date.parse(r.from) <= now) && (!r.until || Date.parse(r.until) > now));
}
