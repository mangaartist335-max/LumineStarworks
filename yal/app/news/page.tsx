import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle, SectionNav } from "@/components/SectionNav";
import { BBCode } from "@/components/BBCode";
import { newsUrl, visibleNews } from "@/lib/catalog";
import { getViewer } from "@/lib/viewer";
import { formatLongDate } from "@/lib/time";

export const metadata: Metadata = { title: "Anime News" };

export default async function NewsIndex() {
  const { asOf } = await getViewer();
  const news = visibleNews(asOf);
  return (
    <>
      <Breadcrumb items={[{ label: "Community", href: "/community" }, { label: "News" }]} />
      <div className="page single">
        <main>
          <PageTitle title="Anime News" attached />
          <SectionNav section="community" active="/news" />
          <div className="box" style={{ borderTop: "none" }}>
            {news.map((n) => (
              <div className="news-item" key={n.id}>
                <h3>
                  <Link href={newsUrl(n)}>{n.title}</Link>
                </h3>
                <div className="meta">
                  {formatLongDate(n.publishedAt)} by {n.author}
                </div>
                <div className="news-body post-content">
                  <BBCode body={n.body} />
                </div>
              </div>
            ))}
            {news.length === 0 && <div className="empty">No news has been posted at this point in time.</div>}
          </div>
        </main>
      </div>
    </>
  );
}
