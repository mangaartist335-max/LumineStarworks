"use client";

// Goggle: the Connected Era's search engine. Results come from the archive
// index and only include pages that existed at the computer's current date.
// A separate, clearly labelled link searches today's live web in the real
// browser; those results are never presented as part of the archive.

import { useMemo, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { A, useSite, usePageTitle } from "../SiteContext";
import { getSearchIndex } from "../searchIndex";
import { DATE_FILTERS, type DocKind } from "@/lib/search";
import { newId } from "@/lib/ids";
import { formatDate, iso } from "@/lib/time";
import { searchUrl } from "@/lib/web/url";

interface SearchEntry {
  id: string;
  owner: string;
  q: string;
  at: string;
  origin: "user";
}

function Logo({ small }: { small?: boolean }) {
  return (
    <div className={`goggle-logo${small ? " small" : ""}`} aria-label="Goggle">
      <span>G</span>
      <span>o</span>
      <span>g</span>
      <span>g</span>
      <span>l</span>
      <span>e</span>
    </div>
  );
}

function SearchBox({ initial, autoFocus, kind }: { initial: string; autoFocus?: boolean; kind?: string }) {
  const { navigate } = useSite();
  const { now, store, user } = useSystem();
  const [history] = useCollection<SearchEntry>("searches");
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => {
    const past = [...history].sort((a, b) => b.at.localeCompare(a.at)).map((h) => h.q);
    return getSearchIndex().suggest(q, now(), [...new Set(past)], 8);
  }, [q, history, now]);
  const submit = async (text: string, lucky = false) => {
    const t = text.trim();
    if (!t) return;
    setOpen(false);
    if (user) await store.put<SearchEntry>("searches", { id: newId("srch"), owner: user.id, q: t, at: iso(now()), origin: "user" });
    if (lucky) {
      const top = getSearchIndex().search(t, { now: now() }).hits[0];
      if (top) return navigate(top.doc.url);
    }
    navigate(searchUrl(t, kind ? { tbm: kind } : {}));
  };
  return (
    <form
      className="goggle-form"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(q);
      }}
    >
      <div className="goggle-box">
        <input
          value={q}
          onChange={(e) => (setQ(e.target.value), setOpen(true))}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoFocus={autoFocus}
          aria-label="Search"
          name="q"
          autoComplete="off"
        />
        {open && suggestions.length > 0 && (
          <ul className="goggle-suggest" role="listbox">
            {suggestions.map((s) => (
              <li key={s} role="option" aria-selected={false} onMouseDown={(e) => (e.preventDefault(), setQ(s), void submit(s))}>
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="goggle-buttons">
        <button className="goggle-btn">Goggle Search</button>
        <button type="button" className="goggle-btn" onClick={() => submit(q, true)}>
          I&apos;m Feeling Lucky
        </button>
      </div>
    </form>
  );
}

function Home() {
  usePageTitle("Goggle");
  return (
    <div className="goggle-home">
      <div className="goggle-top">
        <A href="http://www.metube.com/">MeTube</A>
        <A href="http://www.mangashelf.net/">MangaShelf</A>
        <A href="http://www.connectmail.net/">Mail</A>
      </div>
      <Logo />
      <SearchBox initial="" autoFocus />
      <p className="goggle-note">Searching the Connected Era web, as of your computer&apos;s date.</p>
    </div>
  );
}

function Results() {
  const { url } = useSite();
  const { now, computer } = useSystem();
  const q = url.params.get("q") ?? "";
  const tbm = url.params.get("tbm");
  const kind: DocKind | "all" = tbm === "vid" ? "video" : tbm === "isch" ? "image" : "all";
  const dateFilter = DATE_FILTERS.find((f) => f.id === (url.params.get("tbs") ?? "any")) ?? DATE_FILTERS[0];
  const page = Math.max(1, Number(url.params.get("page") ?? 1));
  const t = now();
  usePageTitle(`${q} - Goggle Search`);
  const started = performance.now();
  const results = useMemo(
    () => getSearchIndex().search(q, { now: t, kind: kind === "all" ? "all" : kind, since: dateFilter.days ? t - dateFilter.days * 86400_000 : undefined, page, perPage: kind === "image" ? 24 : 10 }),
    [q, t, kind, dateFilter, page],
  );
  const seconds = ((performance.now() - started) / 1000 + 0.07).toFixed(2);
  const link = (extra: Record<string, string | undefined>) => {
    const p: Record<string, string> = { q };
    const merged = { tbm: tbm ?? undefined, tbs: dateFilter.id === "any" ? undefined : dateFilter.id, ...extra };
    for (const [k, v] of Object.entries(merged)) if (v) p[k] = v;
    return searchUrl(q, Object.fromEntries(Object.entries(p).filter(([k]) => k !== "q")));
  };
  return (
    <div className="goggle-results">
      <div className="goggle-header">
        <A href="http://www.goggle.com/" aria-label="Goggle home">
          <Logo small />
        </A>
        <SearchBox key={q} initial={q} kind={tbm ?? undefined} />
      </div>
      <nav className="goggle-tabs">
        <A href={link({ tbm: undefined, page: undefined })} className={kind === "all" ? "on" : ""}>
          Web
        </A>
        <A href={link({ tbm: "isch", page: undefined })} className={kind === "image" ? "on" : ""}>
          Images
        </A>
        <A href={link({ tbm: "vid", page: undefined })} className={kind === "video" ? "on" : ""}>
          Videos
        </A>
        <span className="goggle-tools">
          {DATE_FILTERS.map((f) => (
            <A key={f.id} href={link({ tbs: f.id === "any" ? undefined : f.id, page: undefined })} className={f.id === dateFilter.id ? "on" : ""}>
              {f.label}
            </A>
          ))}
        </span>
      </nav>
      <div className="goggle-stats">
        About {results.total.toLocaleString("en-US")} result{results.total === 1 ? "" : "s"} ({seconds} seconds)
      </div>
      {results.total === 0 && (
        <div className="goggle-none">
          <p>
            Your search - <b>{q}</b> - did not match any documents{dateFilter.days ? ` from the ${dateFilter.label.toLowerCase()}` : ""}.
          </p>
          <ul>
            <li>Make sure all words are spelled correctly.</li>
            <li>Try different or more general keywords.</li>
            <li>Some pages don&apos;t exist yet on this date. Things published later will turn up once your computer&apos;s clock reaches them.</li>
          </ul>
        </div>
      )}
      {kind === "image" ? (
        <div className="goggle-images">
          {results.hits.map((h) => (
            <A key={h.doc.id} href={h.doc.url} className="goggle-image" title={h.doc.title}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={h.doc.image} alt={h.doc.title} />
              <small>{h.doc.site}</small>
            </A>
          ))}
        </div>
      ) : (
        <ol className="goggle-list">
          {results.hits.map((h) => (
            <li key={h.doc.id} className={h.doc.kind === "video" ? "video-result" : ""}>
              {h.doc.kind === "video" && h.doc.image && (
                <A href={h.doc.url} className="video-thumb" tabIndex={-1} aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.doc.image} alt="" />
                </A>
              )}
              <div>
                <A href={h.doc.url} className="result-title">
                  {h.doc.title}
                </A>
                <div className="result-url">{h.doc.url.replace(/^http:\/\//, "")}</div>
                <div className="result-snippet">
                  <span className="muted">{formatDate(Date.parse(h.doc.publishedAt), computer.timeZone)} - </span>
                  {h.snippet.map((s, i) => (s.hit ? <b key={i}>{s.text}</b> : <span key={i}>{s.text}</span>))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      {results.pages > 1 && (
        <nav className="goggle-pages" aria-label="Result pages">
          <span className="goggle-o" aria-hidden>
            G{"o".repeat(Math.min(10, results.pages + 1))}ggle
          </span>
          <div>
            {page > 1 && <A href={link({ page: String(page - 1) })}>Previous</A>}
            {Array.from({ length: results.pages }, (_, i) => i + 1).map((n) =>
              n === page ? (
                <b key={n}>{n}</b>
              ) : (
                <A key={n} href={link({ page: String(n) })}>
                  {n}
                </A>
              ),
            )}
            {page < results.pages && <A href={link({ page: String(page + 1) })}>Next</A>}
          </div>
        </nav>
      )}
      <div className="goggle-live">
        Looking for today&apos;s web instead?{" "}
        <button className="link-btn" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank", "noopener,noreferrer")}>
          Search the live web for &quot;{q}&quot;
        </button>{" "}
        <span className="muted">(opens Google in your real browser; current results, not part of the archive)</span>
      </div>
    </div>
  );
}

export default function Goggle() {
  const { url } = useSite();
  if (url.path === "/search" && url.params.get("q")) return <Results />;
  return <Home />;
}
