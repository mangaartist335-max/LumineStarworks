"use client";

// Flow Pictures' official site: news, the works catalogue, staff and music.
// Every fact comes from data/catalogue.ts, the same source YourAnimeList,
// AniWire and AniFanWiki use.

import { useSystem } from "@/components/system/system";
import { A, useSite, usePageTitle } from "../SiteContext";
import { catalogue, FORMAT_LABEL, LUNE, people, personBySlug, titleBySlug, yalAnimeUrl, type CatalogueTitle, type Format } from "@/data/catalogue";
import { FLOW_HOST, flowNews, workListedFrom } from "@/data/flow";
import { wikiUrl } from "@/data/wiki";
import { formatDate } from "@/lib/time";
import { siteUrl } from "@/lib/web/url";

const fp = (path = "/", params?: Record<string, string>) => siteUrl(FLOW_HOST, path, params);
const FORMATS: Format[] = ["TV", "Film", "OVA", "TV special"];

function useWorks(): CatalogueTitle[] {
  const { now } = useSystem();
  const t = now();
  return catalogue.filter((w) => workListedFrom(w.year) <= t);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flowpictures">
      <header className="fp-head">
        <A href={fp("/")} className="fp-logo">
          <span className="fp-mark" aria-hidden />
          FLOW PICTURES
        </A>
        <nav>
          <A href={fp("/")}>Home</A>
          <A href={fp("/works")}>Works</A>
          <A href={fp("/staff")}>Staff</A>
          <A href={fp("/music")}>Music</A>
          <A href={fp("/about")}>About</A>
        </nav>
      </header>
      <main className="fp-main">{children}</main>
      <footer className="fp-foot">© Flow Pictures · Thank you for watching</footer>
    </div>
  );
}

function WorkCard({ w }: { w: CatalogueTitle }) {
  return (
    <A href={fp(`/works/${w.slug}`)} className={`fp-card fp-${w.format === "TV" ? "tv" : w.format === "Film" ? "film" : "other"}`}>
      <span className="fp-card-year">{w.years}</span>
      <strong>{w.title}</strong>
      <span className="fp-card-format">
        {FORMAT_LABEL[w.format]}
        {w.shape ? ` · ${w.shape}` : ""}
      </span>
      <p>{w.description}</p>
    </A>
  );
}

function Home() {
  usePageTitle("Flow Pictures");
  const { now, computer } = useSystem();
  const t = now();
  const works = useWorks();
  const news = flowNews.filter((n) => Date.parse(n.at) <= t).sort((a, b) => b.at.localeCompare(a.at));
  const latest = [...works].sort((a, b) => b.year - a.year).slice(0, 4);
  return (
    <Shell>
      <section className="fp-hero">
        <h1>Stories in motion since 2000</h1>
        <p>From Vacant Crown: Liminal War to Sinful Apex, thank you for watching with us.</p>
        <A href={fp("/works")} className="fp-button">
          See all our works
        </A>
      </section>
      <div className="fp-cols">
        <section>
          <h2>News</h2>
          {news.map((n) => (
            <article key={n.id} className="fp-news">
              <time>{formatDate(Date.parse(n.at), computer.timeZone)}</time>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
              {n.work && <A href={fp(`/works/${n.work}`)}>About {titleBySlug(n.work)?.title}</A>}
            </article>
          ))}
          {news.length === 0 && <p className="empty">No news right now.</p>}
        </section>
        <section>
          <h2>Latest works</h2>
          <div className="fp-grid narrow">
            {latest.map((w) => (
              <WorkCard key={w.slug} w={w} />
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Works() {
  const { url } = useSite();
  const format = url.params.get("format");
  const works = useWorks().filter((w) => !format || w.format === format);
  usePageTitle("Works - Flow Pictures");
  return (
    <Shell>
      <h1 className="fp-h1">Works</h1>
      <p className="fp-note">Our catalogue, oldest first. It shows the titles in our catalogue; animation-studio credits are listed only where they&apos;re on the record.</p>
      <div className="fp-filters">
        <A href={fp("/works")} className={!format ? "on" : ""}>
          All
        </A>
        {FORMATS.map((f) => (
          <A key={f} href={fp("/works", { format: f })} className={format === f ? "on" : ""}>
            {FORMAT_LABEL[f]}
          </A>
        ))}
      </div>
      <div className="fp-grid">
        {works.map((w) => (
          <WorkCard key={w.slug} w={w} />
        ))}
      </div>
    </Shell>
  );
}

function Work({ slug }: { slug: string }) {
  const w = useWorks().find((x) => x.slug === slug);
  usePageTitle(w ? `${w.title} - Flow Pictures` : "Not found - Flow Pictures");
  if (!w) {
    return (
      <Shell>
        <h1 className="fp-h1">Work not found</h1>
        <p>
          Have a look at <A href={fp("/works")}>all our works</A>.
        </p>
      </Shell>
    );
  }
  return (
    <Shell>
      <div className="fp-work">
        <div className="fp-work-banner">
          <span>{w.years}</span>
          <h1>{w.title}</h1>
          <span>
            {FORMAT_LABEL[w.format]}
            {w.shape ? ` · ${w.shape}` : ""}
            {w.studio ? ` · ${w.studio}` : ""}
          </span>
        </div>
        <p className="fp-lede">{w.description}</p>
        {w.staff.length > 0 && (
          <>
            <h2>Staff</h2>
            <ul>
              {w.staff.map((s) => (
                <li key={s}>
                  {personBySlug(s)!.role}: <A href={fp(`/staff#${s}`)}>{personBySlug(s)!.name}</A>
                </li>
              ))}
            </ul>
          </>
        )}
        {w.song && (
          <>
            <h2>Music</h2>
            <p>
              &quot;{w.song}&quot; by <A href={fp("/music")}>LUNE</A>
            </p>
          </>
        )}
        {w.related?.length ? (
          <>
            <h2>Related</h2>
            <ul>
              {w.related.map((r) => (
                <li key={r.slug}>
                  {r.label}: <A href={fp(`/works/${r.slug}`)}>{titleBySlug(r.slug)!.title}</A>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <h2>Elsewhere on the web</h2>
        <ul>
          <li>
            <A href={yalAnimeUrl(w)}>{w.title} on YourAnimeList</A>
          </li>
          <li>
            <A href={wikiUrl(w.title)}>{w.title} on AniFanWiki</A>
          </li>
        </ul>
        <p className="fp-note">More details about this title (episodes, cast and dates) will be added here as they&apos;re confirmed.</p>
      </div>
    </Shell>
  );
}

function Staff() {
  usePageTitle("Staff - Flow Pictures");
  return (
    <Shell>
      <h1 className="fp-h1">Staff</h1>
      <p className="fp-note">Some of the people whose work runs through our catalogue.</p>
      <div className="fp-staff">
        {people.map((p) => (
          <div key={p.slug} id={p.slug} className="fp-person">
            <strong>{p.name}</strong>
            <span>{p.role}</span>
            <p>{p.works.join(" · ")}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function Music() {
  usePageTitle("Music - Flow Pictures");
  return (
    <Shell>
      <h1 className="fp-h1">Music</h1>
      <div className="fp-music">
        <h2>{LUNE.name}</h2>
        <p>{LUNE.bio}</p>
        <ul>
          {LUNE.songs.map((s) => (
            <li key={s.song}>
              &quot;{s.song}&quot; · <A href={fp(`/works/${s.slug}`)}>{s.title}</A>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}

function About() {
  usePageTitle("About - Flow Pictures");
  const works = useWorks();
  return (
    <Shell>
      <h1 className="fp-h1">About Flow Pictures</h1>
      <p>Flow Pictures is a Japanese animation studio. Our catalogue runs from Vacant Crown: Liminal War in 2000 through River of Sparks, Skyfall Chronicle, Steelbound Testament and Blizzard Requiem, and Sinful Apex (2011–2012) is our final marquee production.</p>
      <p>
        There are {works.length} titles in our catalogue so far. Thank you to every viewer who has watched along over the years!
      </p>
    </Shell>
  );
}

export default function FlowPictures() {
  const { url } = useSite();
  const parts = url.path.split("/").filter(Boolean);
  if (parts[0] === "works" && parts[1]) return <Work key={parts[1]} slug={parts[1]} />;
  if (parts[0] === "works") return <Works />;
  if (parts[0] === "staff") return <Staff />;
  if (parts[0] === "music") return <Music />;
  if (parts[0] === "about") return <About />;
  return <Home />;
}
