import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle, SectionNav } from "@/components/SectionNav";
import { animeUrl, getAnime } from "@/lib/catalog";
import { recommendationsFor } from "@/lib/reviews";
import { getViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Anime Recommendations" };

export default async function RecommendationsIndex() {
  const { asOf } = await getViewer();
  const recs = await recommendationsFor(asOf);
  return (
    <>
      <Breadcrumb items={[{ label: "Anime", href: "/anime" }, { label: "Recommendations" }]} />
      <div className="page single">
        <main>
          <PageTitle title="Anime Recommendations" attached />
          <SectionNav section="anime" active="/recommendations" />
          <div className="box" style={{ borderTop: "none" }}>
            <table className="yal-table">
              <tbody>
                {recs.map((r) => {
                  const from = getAnime(r.fromId, asOf)!;
                  const to = getAnime(r.toId, asOf)!;
                  return (
                    <tr key={r.id}>
                      <td style={{ width: 260 }}>
                        If you liked <Link href={animeUrl(from)}>{from.title}</Link>
                        <span className="sub">
                          &hellip;then you might like <Link href={animeUrl(to)}>{to.title}</Link>
                        </span>
                      </td>
                      <td>
                        {r.reason}
                        <span className="sub">
                          by <Link href={`/profile/${encodeURIComponent(r.author)}`}>{r.author}</Link> &middot; {formatDate(r.postedAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {recs.length === 0 && <div className="empty">No recommendations at this point in time.</div>}
          </div>
        </main>
      </div>
    </>
  );
}
