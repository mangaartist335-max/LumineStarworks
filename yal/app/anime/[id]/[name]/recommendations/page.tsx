import type { Metadata } from "next";
import Link from "next/link";
import { NA } from "@/components/ui";
import { RecommendationForm } from "@/components/anime/Forms";
import { loadAnime } from "@/lib/anime-page";
import { animeUrl, getAnime, getAnimeAnyTime, visibleAnime } from "@/lib/catalog";
import { recommendationsFor } from "@/lib/reviews";
import { getViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/time";

export async function generateMetadata(props: PageProps<"/anime/[id]/[name]/recommendations">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `${getAnimeAnyTime(Number(id))?.title ?? "Anime"} - Recommendations` };
}

export default async function AnimeRecommendations(props: PageProps<"/anime/[id]/[name]/recommendations">) {
  const { id } = await props.params;
  const load = await loadAnime(id);
  if (load.state !== "ok") return null;
  const { anime, asOf } = load;
  const viewer = await getViewer();
  const recs = await recommendationsFor(asOf, anime.id);

  return (
    <>
      <h2 className="section-h">Recommendations</h2>
      {recs.length ? (
        <table className="yal-table">
          <tbody>
            {recs.map((r) => {
              const other = getAnime(r.fromId === anime.id ? r.toId : r.fromId, asOf)!;
              return (
                <tr key={r.id}>
                  <td style={{ width: 200 }}>
                    <Link href={animeUrl(other)}>
                      <b>{other.title}</b>
                    </Link>
                    <span className="sub">{r.fromId === anime.id ? "If you liked this, watch" : "Fans of this also recommend"}</span>
                  </td>
                  <td>
                    {r.reason}
                    <span className="sub">
                      Recommended by <Link href={`/profile/${encodeURIComponent(r.author)}`}>{r.author}</Link> on {formatDate(r.postedAt)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>
          <NA>No recommendations have been made for this title.</NA>
        </p>
      )}
      <div style={{ marginTop: 12 }}>
        {viewer.account ? (
          <RecommendationForm
            fromId={anime.id}
            options={visibleAnime(asOf)
              .filter((a) => a.id !== anime.id)
              .map((a) => ({ id: a.id, title: a.title }))
              .sort((a, b) => a.title.localeCompare(b.title))}
          />
        ) : (
          <p>
            <Link href={`/login?next=${encodeURIComponent(animeUrl(anime, "recommendations"))}`}>Log in</Link> to make a recommendation.
          </p>
        )}
      </div>
    </>
  );
}
