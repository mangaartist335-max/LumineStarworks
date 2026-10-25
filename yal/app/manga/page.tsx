import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle } from "@/components/SectionNav";
import { ArchiveNote, Cover } from "@/components/ui";
import { getPerson, mangaUrl, personUrl, visibleManga } from "@/lib/catalog";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Manga" };

export default async function MangaIndex() {
  const { asOf } = await getViewer();
  const list = visibleManga(asOf);
  return (
    <>
      <Breadcrumb items={[{ label: "Manga" }]} />
      <div className="page single">
        <main>
          <PageTitle title="Manga Search" />
          <div className="box">
            <div className="box-head">{list.length} entries</div>
            <div className="entry-list">
              {list.map((m) => (
                <div className="entry" key={m.id}>
                  <div className="thumb">
                    <Cover title={m.title} small />
                  </div>
                  <div>
                    <Link href={mangaUrl(m)} className="title">
                      {m.title}
                    </Link>
                    <div className="meta">
                      {m.type} · {m.status ?? "Status not documented"} ·{" "}
                      {m.authors.map((a) => {
                        const p = getPerson(a.personId, asOf);
                        return p ? (
                          <Link key={a.personId} href={personUrl(p)}>
                            {p.name}
                          </Link>
                        ) : null;
                      })}
                    </div>
                    <div className="meta">{m.genres.join(", ")}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ArchiveNote>Manga records are added as they are documented. Volume, chapter and serialization details are left blank until a source confirms them.</ArchiveNote>
        </main>
      </div>
    </>
  );
}
