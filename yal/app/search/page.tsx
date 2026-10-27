import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle } from "@/components/SectionNav";
import { AnimeEntry } from "@/components/anime/AnimeEntry";
import { Avatar } from "@/components/ui";
import {
  characterUrl,
  companyUrl,
  mangaUrl,
  personUrl,
  visibleAnime,
  visibleCharacters,
  visibleCompanies,
  visibleManga,
  visiblePeople,
} from "@/lib/catalog";
import { visibleMembers } from "@/lib/members";
import { boardThreads, threadPosts } from "@/lib/forum";
import { excerpt } from "@/lib/bbcode";
import { getViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Search" };

const TYPES = [
  ["all", "All"],
  ["anime", "Anime"],
  ["manga", "Manga"],
  ["characters", "Characters"],
  ["people", "People"],
  ["companies", "Companies"],
  ["users", "Users"],
  ["forum", "Forum"],
] as const;

export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams;
  const q = ((Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "").trim();
  const type = ((Array.isArray(sp.type) ? sp.type[0] : sp.type) ?? "all") as (typeof TYPES)[number][0];
  const { asOf } = await getViewer();
  const needle = q.toLowerCase();
  const has = (...fields: (string | undefined | null)[]) => fields.some((f) => f && f.toLowerCase().includes(needle));
  const want = (t: string) => type === "all" || type === t;
  const enough = needle.length >= 2;

  const anime = enough && want("anime") ? visibleAnime(asOf).filter((a) => has(a.title, a.titleJapanese, ...a.synonyms)) : [];
  const manga = enough && want("manga") ? visibleManga(asOf).filter((m) => has(m.title, m.titleJapanese)) : [];
  const characters = enough && want("characters") ? visibleCharacters(asOf).filter((c) => has(c.name, c.role)) : [];
  const people = enough && want("people") ? visiblePeople(asOf).filter((p) => has(p.name, p.nativeName)) : [];
  const companies = enough && want("companies") ? visibleCompanies(asOf).filter((c) => has(c.name)) : [];
  const users = enough && want("users") ? (await visibleMembers(asOf)).filter((m) => has(m.name)).slice(0, 30) : [];
  let forum: { threadId: string; title: string; number?: number; snippet?: string; at: string }[] = [];
  if (enough && want("forum")) {
    const threads = await boardThreads(null, asOf);
    const titleHits = threads.filter((t) => has(t.thread.title)).map((t) => ({ threadId: t.thread.id, title: t.thread.title, at: t.thread.createdAt }));
    const postHits: typeof forum = [];
    if (type === "forum") {
      for (const t of threads) {
        for (const p of await threadPosts(t.thread.id, asOf)) {
          if (postHits.length >= 40) break;
          if (has(p.body)) postHits.push({ threadId: t.thread.id, title: t.thread.title, number: p.number, snippet: `${p.author}: ${excerpt(p.body, 140)}`, at: p.at });
        }
      }
    }
    forum = [...titleHits, ...postHits].slice(0, 50);
  }
  const total = anime.length + manga.length + characters.length + people.length + companies.length + users.length + forum.length;

  return (
    <>
      <Breadcrumb items={[{ label: "Search" }]} />
      <div className="page single">
        <main>
          <PageTitle title={q ? `Search results for "${q}"` : "Search"} />
          <form action="/search" method="get" className="controls" style={{ borderTop: "1px solid var(--line-dark)", marginBottom: 15 }}>
            <label htmlFor="search-q" className="sr-only">
              Search
            </label>
            <input id="search-q" className="field" type="text" name="q" defaultValue={q} placeholder="Search anime, manga, users..." style={{ width: 280 }} />
            <label htmlFor="search-type" className="sr-only">
              Category
            </label>
            <select id="search-type" className="field" name="type" defaultValue={type}>
              {TYPES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <button className="btn primary" type="submit">
              Search
            </button>
            {type !== "forum" && enough && (
              <Link href={`/search?type=forum&q=${encodeURIComponent(q)}`} className="small">
                Search inside forum posts
              </Link>
            )}
          </form>
          {!enough && <div className="notice">Please enter at least 2 characters.</div>}
          {enough && total === 0 && <div className="notice">No results found for &quot;{q}&quot; at this point in time.</div>}

          {anime.length > 0 && (
            <div className="box">
              <div className="box-head">Anime ({anime.length})</div>
              <div className="entry-list">
                {anime.map((a) => (
                  <AnimeEntry key={a.id} anime={a} asOf={asOf} />
                ))}
              </div>
            </div>
          )}
          {(manga.length > 0 || characters.length > 0 || people.length > 0 || companies.length > 0) && (
            <div className="two-col">
              {manga.length > 0 && <ResultBox title="Manga" items={manga.map((m) => ({ href: mangaUrl(m), label: m.title, sub: m.type }))} />}
              {characters.length > 0 && <ResultBox title="Characters" items={characters.map((c) => ({ href: characterUrl(c), label: c.name, sub: c.role }))} />}
              {people.length > 0 && <ResultBox title="People" items={people.map((p) => ({ href: personUrl(p), label: p.name, sub: p.occupations.join(", ") }))} />}
              {companies.length > 0 && <ResultBox title="Companies" items={companies.map((c) => ({ href: companyUrl(c), label: c.name, sub: c.kinds.join(", ") }))} />}
            </div>
          )}
          {users.length > 0 && (
            <div className="box">
              <div className="box-head">Users ({users.length})</div>
              <div className="box-body" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {users.map((u) => (
                  <Link key={u.name} href={`/profile/${encodeURIComponent(u.name)}`} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    <Avatar id={u.avatar} className="avatar xs" />
                    {u.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {forum.length > 0 && (
            <div className="box">
              <div className="box-head">Forum ({forum.length})</div>
              <table className="yal-table">
                <tbody>
                  {forum.map((f, i) => (
                    <tr key={`${f.threadId}-${f.number ?? "t"}-${i}`}>
                      <td>
                        <Link href={`/forum/thread/${f.threadId}${f.number ? `#p${f.number}` : ""}`}>{f.title}</Link>
                        {f.number && <span className="muted"> #{f.number}</span>}
                        {f.snippet && <span className="sub">{f.snippet}</span>}
                      </td>
                      <td className="muted small">{formatDate(f.at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

function ResultBox({ title, items }: { title: string; items: { href: string; label: string; sub: string }[] }) {
  return (
    <div className="box">
      <div className="box-head">
        {title} ({items.length})
      </div>
      <table className="yal-table">
        <tbody>
          {items.map((i) => (
            <tr key={i.href}>
              <td>
                <Link href={i.href}>{i.label}</Link>
                <span className="sub">{i.sub}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
