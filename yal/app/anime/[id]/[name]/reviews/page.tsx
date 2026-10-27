import type { Metadata } from "next";
import Link from "next/link";
import { NA } from "@/components/ui";
import { ReviewView } from "@/components/anime/ReviewView";
import { ReviewForm } from "@/components/anime/Forms";
import { loadAnime } from "@/lib/anime-page";
import { animeUrl, getAnimeAnyTime } from "@/lib/catalog";
import { reviewsFor } from "@/lib/reviews";
import { getViewer } from "@/lib/viewer";

export async function generateMetadata(props: PageProps<"/anime/[id]/[name]/reviews">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `${getAnimeAnyTime(Number(id))?.title ?? "Anime"} - Reviews` };
}

export default async function AnimeReviews(props: PageProps<"/anime/[id]/[name]/reviews">) {
  const { id } = await props.params;
  const load = await loadAnime(id);
  if (load.state !== "ok") return null;
  const { anime, asOf } = load;
  const viewer = await getViewer();
  const reviews = await reviewsFor(asOf, anime.id);
  const mine = viewer.account && reviews.some((r) => r.origin === "member" && r.author === viewer.account!.username);

  return (
    <>
      <h2 className="section-h">
        Reviews <span className="more">{reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
      </h2>
      {reviews.length ? (
        reviews.map((r) => (
          <div id={`review-${r.id}`} key={r.id}>
            <ReviewView review={r} />
          </div>
        ))
      ) : (
        <p>
          <NA>No reviews have been submitted for this title. Be the first!</NA>
        </p>
      )}
      {viewer.account ? (
        mine ? (
          <p className="hint">You have already reviewed this anime.</p>
        ) : (
          <ReviewForm animeId={anime.id} maxEpisodes={anime.episodesPlanned} />
        )
      ) : (
        <p>
          <Link href={`/login?next=${encodeURIComponent(animeUrl(anime, "reviews"))}`}>Log in</Link> to write a review.
        </p>
      )}
    </>
  );
}
