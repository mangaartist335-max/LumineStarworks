import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle, SectionNav } from "@/components/SectionNav";
import { ArchiveNote, Cover, fmtNum } from "@/components/ui";
import { animeStatus, animeUrl, latestScore, visibleAnime } from "@/lib/catalog";
import { animeStats } from "@/lib/stats";
import { getViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Top Anime" };

export default async function TopAnime(props: PageProps<"/topanime">) {
  const sp = await props.searchParams;
  const by = (Array.isArray(sp.by) ? sp.by[0] : sp.by) === "popularity" ? "popularity" : "score";
  const { asOf } = await getViewer();
  const rows = await Promise.all(visibleAnime(asOf).map(async (a) => ({ a, s: latestScore(a, asOf), m: (await animeStats(a.id, asOf)).members })));
  const ranked = by === "score" ? rows.filter((r) => r.s).sort((x, y) => y.s!.score - x.s!.score) : rows.filter((r) => r.m > 0).sort((x, y) => y.m - x.m);

  return (
    <>
      <Breadcrumb items={[{ label: "Anime", href: "/anime" }, { label: "Top Anime" }]} />
      <div className="page single">
        <main>
          <PageTitle title="Top Anime" attached />
          <SectionNav section="anime" active="/topanime" />
          <div className="controls" style={{ borderTop: "none" }}>
            <Link href="/topanime" className={`btn${by === "score" ? " primary" : ""}`}>
              By Score
            </Link>
            <Link href="/topanime?by=popularity" className={`btn${by === "popularity" ? " primary" : ""}`}>
              By Popularity
            </Link>
          </div>
          <div className="box" style={{ marginTop: 15 }}>
            <table className="yal-table">
              <thead>
                <tr>
                  <th className="num">Rank</th>
                  <th>Title</th>
                  <th className="num">{by === "score" ? "Score" : "Members"}</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r, i) => (
                  <tr key={r.a.id}>
                    <td className="num" style={{ fontSize: 18, fontWeight: "bold", color: "var(--muted)" }}>
                      {i + 1}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div className="thumb">
                          <Cover src={r.a.cover} title={r.a.title} small />
                        </div>
                        <div>
                          <Link href={animeUrl(r.a)}>
                            <b>{r.a.title}</b>
                          </Link>
                          <span className="sub">
                            {r.a.type} ({r.a.episodesPlanned ?? "?"} eps) &middot; {animeStatus(r.a, asOf)}
                          </span>
                          <span className="sub">{fmtNum(r.m)} members</span>
                        </div>
                      </div>
                    </td>
                    <td className="num">
                      {by === "score" ? (
                        <>
                          <b style={{ fontSize: 15 }}>{r.s!.score.toFixed(2)}</b>
                          <span className="sub">{formatDate(r.s!.capturedAt)}</span>
                        </>
                      ) : (
                        fmtNum(r.m)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ranked.length === 0 && <div className="empty">No titles qualify for this ranking at this point in time.</div>}
          </div>
          <ArchiveNote>
            Scores are archived snapshots and only appear from the moment they were captured. Titles without a documented score are not ranked rather than
            given an estimated one.
          </ArchiveNote>
        </main>
      </div>
    </>
  );
}
