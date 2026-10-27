import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle, SectionNav } from "@/components/SectionNav";
import { AnimeEntry } from "@/components/anime/AnimeEntry";
import { ArchiveNote } from "@/components/ui";
import { animeYear, latestScore, visibleAnime } from "@/lib/catalog";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Anime Search" };

const LETTERS = ".ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default async function AnimeDirectory(props: PageProps<"/anime">) {
  const sp = await props.searchParams;
  const { asOf } = await getViewer();
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(sp.q).trim().toLowerCase();
  const letter = one(sp.letter).toUpperCase();
  const type = one(sp.type);
  const genre = one(sp.genre);
  const sort = one(sp.sort) || "title";

  const all = visibleAnime(asOf);
  const genres = [...new Set(all.flatMap((a) => a.genres))].sort();
  let list = all.filter((a) => {
    if (q && ![a.title, ...a.synonyms, a.titleJapanese ?? ""].some((t) => t.toLowerCase().includes(q))) return false;
    if (letter === "." && /^[A-Za-z]/.test(a.title)) return false;
    if (letter && letter !== "." && !a.title.toUpperCase().startsWith(letter)) return false;
    if (type && a.type !== type) return false;
    if (genre && !a.genres.includes(genre)) return false;
    return true;
  });
  list = list.sort((a, b) => {
    if (sort === "year") return (animeYear(b) ?? -1) - (animeYear(a) ?? -1) || a.title.localeCompare(b.title);
    if (sort === "score") return (latestScore(b, asOf)?.score ?? -1) - (latestScore(a, asOf)?.score ?? -1) || a.title.localeCompare(b.title);
    return a.title.localeCompare(b.title);
  });
  const params = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(q && { q }), ...(letter && { letter }), ...(type && { type }), ...(genre && { genre }), ...(sort !== "title" && { sort }), ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    const s = p.toString();
    return s ? `/anime?${s}` : "/anime";
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Anime" }]} />
      <div className="page single">
        <main>
          <PageTitle title="Anime Search" attached />
          <SectionNav section="anime" active="/anime" />
          <div className="box" style={{ borderTop: "none" }}>
            <div className="box-body">
              <form action="/anime" method="get" style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 8 }}>
                <label htmlFor="anime-q" className="sr-only">
                  Title
                </label>
                <input id="anime-q" className="field" type="text" name="q" defaultValue={q} placeholder="Search by title..." />
                <label htmlFor="anime-type" className="sr-only">
                  Type
                </label>
                <select id="anime-type" className="field" name="type" defaultValue={type}>
                  <option value="">All types</option>
                  {["TV", "OVA", "Special", "Movie", "Unknown"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <label htmlFor="anime-genre" className="sr-only">
                  Genre
                </label>
                <select id="anime-genre" className="field" name="genre" defaultValue={genre}>
                  <option value="">All genres</option>
                  {genres.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
                <label htmlFor="anime-sort" className="sr-only">
                  Sort
                </label>
                <select id="anime-sort" className="field" name="sort" defaultValue={sort}>
                  <option value="title">Sort by title</option>
                  <option value="year">Sort by year</option>
                  <option value="score">Sort by score</option>
                </select>
                <button className="btn primary" type="submit">
                  Search
                </button>
                {(q || type || genre || letter) && (
                  <Link href="/anime" className="small">
                    Clear filters
                  </Link>
                )}
              </form>
              <div className="letters" aria-label="Browse by letter">
                {LETTERS.map((l) =>
                  l === letter ? (
                    <span key={l} className="current">
                      {l === "." ? "#" : l}
                    </span>
                  ) : (
                    <Link key={l} href={params({ letter: l })}>
                      {l === "." ? "#" : l}
                    </Link>
                  ),
                )}
              </div>
            </div>
          </div>
          <div className="box">
            <div className="box-head">
              {list.length} entr{list.length === 1 ? "y" : "ies"}
              {genre && ` in ${genre}`}
            </div>
            <div className="entry-list">
              {list.length ? list.map((a) => <AnimeEntry key={a.id} anime={a} asOf={asOf} />) : <div className="empty">No anime matched your search.</div>}
            </div>
          </div>
          <ArchiveNote>
            The database lists {all.length} entries at this point in time. Entries appear from the date they were added to YAL; back-catalogue
            titles with undocumented dates are always listed.
          </ArchiveNote>
        </main>
      </div>
    </>
  );
}
