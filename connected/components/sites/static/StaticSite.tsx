"use client";

import { useSystem } from "@/components/system/system";
import { A, useSite, usePageTitle } from "../SiteContext";
import { staticSiteByHost, type Block } from "@/data/web-pages";
import { formatDate } from "@/lib/time";

function BlockView({ b, base }: { b: Block; base: string }) {
  const { openApp } = useSystem();
  switch (b.kind) {
    case "h":
      return <h2>{b.text}</h2>;
    case "p":
      return <p>{b.text}</p>;
    case "list":
      return b.ordered ? (
        <ol>
          {b.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ol>
      ) : (
        <ul>
          {b.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      );
    case "action":
      return (
        <div className="ss-action">
          {b.action === "link" ? (
            <A href={b.target.startsWith("http") ? b.target : `${base}${b.target}`} className="ss-link">
              {b.label}
            </A>
          ) : (
            <button className="ss-button" onClick={() => (b.action === "open-app" ? openApp(b.target) : openApp("games", { install: b.target }))}>
              {b.label}
            </button>
          )}
          {b.note && <div className="ss-note">{b.note}</div>}
        </div>
      );
  }
}

export default function StaticSite() {
  const { url } = useSite();
  const { now, computer } = useSystem();
  const site = staticSiteByHost(url.host)!;
  const page = site.pages.find((p) => p.path === (url.path.replace(/\/+$/, "") || "/"));
  const exists = page && Date.parse(page.publishedAt) <= now();
  usePageTitle(exists ? `${page.title} - ${site.name}` : `404 Not Found - ${site.name}`);
  const base = `http://www.${site.host}`;
  const t = site.theme;
  return (
    <div className="static-site" style={{ background: t.bg, fontFamily: t.font, ["--ss-accent" as string]: t.accent }}>
      <header style={{ background: t.header, color: t.headerText }}>
        <A href={`${base}/`} className="ss-name" style={{ color: t.headerText }}>
          {site.name}
        </A>
        <span className="ss-tagline">{site.tagline}</span>
        <nav>
          {site.nav.map((n) => (
            <A key={n.path} href={`${base}${n.path}`} style={{ color: t.headerText }}>
              {n.label}
            </A>
          ))}
        </nav>
      </header>
      <main className="ss-main">
        {exists ? (
          <>
            <h1>{page.title}</h1>
            {page.path !== "/" && <div className="ss-date">Posted {formatDate(Date.parse(page.publishedAt), computer.timeZone)}</div>}
            {page.blocks.map((b, i) => (
              <BlockView key={i} b={b} base={base} />
            ))}
          </>
        ) : (
          <>
            <h1>Not Found</h1>
            <p>The requested URL {url.path} was not found on this server.</p>
            <A href={`${base}/`}>Go to the {site.name} home page</A>
          </>
        )}
      </main>
      <footer className="ss-footer">
        © {new Date(now()).getUTCFullYear()} {site.name}
      </footer>
    </div>
  );
}
