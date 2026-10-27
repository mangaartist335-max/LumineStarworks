import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle, SectionNav } from "@/components/SectionNav";
import { ReviewView } from "@/components/anime/ReviewView";
import { animeUrl, getAnime } from "@/lib/catalog";
import { reviewsFor } from "@/lib/reviews";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Anime Reviews" };

export default async function ReviewsIndex() {
  const { asOf } = await getViewer();
  const reviews = await reviewsFor(asOf);
  return (
    <>
      <Breadcrumb items={[{ label: "Anime", href: "/anime" }, { label: "Reviews" }]} />
      <div className="page single">
        <main>
          <PageTitle title="Anime Reviews" attached />
          <SectionNav section="anime" active="/reviews" />
          <div style={{ marginTop: 15 }}>
            {reviews.map((r) => {
              const a = getAnime(r.animeId, asOf)!;
              return <ReviewView key={r.id} review={r} animeTitle={a.title} animeHref={animeUrl(a, "reviews")} />;
            })}
            {reviews.length === 0 && <div className="box empty">No reviews have been written at this point in time.</div>}
          </div>
        </main>
      </div>
    </>
  );
}
