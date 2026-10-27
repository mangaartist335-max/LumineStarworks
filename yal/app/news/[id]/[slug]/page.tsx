import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BBCode } from "@/components/BBCode";
import { ArchiveNote } from "@/components/ui";
import { getNews, relatedLink } from "@/lib/catalog";
import { news as allNews } from "@/data/community";
import { getViewer } from "@/lib/viewer";
import { formatDateTime } from "@/lib/time";

export async function generateMetadata(props: PageProps<"/news/[id]/[slug]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: allNews.find((n) => n.id === Number(id))?.title ?? "News" };
}

export default async function NewsPage(props: PageProps<"/news/[id]/[slug]">) {
  const { id } = await props.params;
  const { asOf } = await getViewer();
  const n = getNews(Number(id), asOf);
  if (!n) notFound();
  const related = n.related.map((r) => relatedLink(r, asOf)).filter((r): r is NonNullable<typeof r> => Boolean(r));
  return (
    <>
      <Breadcrumb items={[{ label: "News", href: "/news" }, { label: n.title }]} />
      <div className="page">
        <main>
          <div className="page-title">
            <h1>{n.title}</h1>
            <div className="subtitle">
              Posted {formatDateTime(n.publishedAt)} by {n.author}
            </div>
          </div>
          <div className="box">
            <div className="box-body post-content">
              <BBCode body={n.body} />
            </div>
          </div>
          {n.source && <ArchiveNote>Facts in this post come from {n.source.cite}. The post text is a reconstruction of YAL&apos;s news copy.</ArchiveNote>}
        </main>
        <aside className="sidebar">
          <div className="side-card">
            <div className="side-head">Related</div>
            <div className="side-body">
              <ul>
                {related.map((r) => (
                  <li key={r.url}>
                    <Link href={r.url}>{r.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
