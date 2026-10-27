import Link from "next/link";
import { BBCode } from "@/components/BBCode";
import { Avatar } from "@/components/ui";
import type { DisplayReview } from "@/lib/reviews";
import { formatDate } from "@/lib/time";

export function ReviewView({ review, animeTitle, animeHref }: { review: DisplayReview; animeTitle?: string; animeHref?: string }) {
  const rows: [string, number][] = [
    ["Overall", review.overall],
    ["Story", review.story],
    ["Animation", review.animation],
    ["Sound", review.sound],
    ["Character", review.character],
    ["Enjoyment", review.enjoyment],
  ];
  return (
    <article className="box" data-origin={review.origin}>
      <div className="box-head warm" style={{ fontWeight: "normal", fontSize: 12 }}>
        <Avatar id={review.avatar} className="avatar sm" />
        <span>
          {animeTitle && animeHref && (
            <>
              <Link href={animeHref}>
                <b>{animeTitle}</b>
              </Link>
              <br />
            </>
          )}
          by <Link href={`/profile/${encodeURIComponent(review.author)}`}>{review.author}</Link>
          <br />
          <span className="muted">
            {formatDate(review.postedAt)} &middot; {review.episodesSeen} episodes seen
            {review.helpful !== null && <> &middot; {review.helpful} people found this review helpful</>}
          </span>
        </span>
        <span className="more" style={{ fontSize: 22, fontWeight: "bold", color: "var(--brand-dark)" }}>
          {review.overall}
          <span style={{ fontSize: 11, color: "var(--muted)" }}>/10</span>
        </span>
      </div>
      <div className="box-body" style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: 12 }}>
        <div className="post-content">
          <BBCode body={review.body} />
        </div>
        <table className="yal-table" style={{ alignSelf: "start" }}>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td className="num">
                  <b>{v}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
