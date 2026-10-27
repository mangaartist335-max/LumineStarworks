import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ArchiveNote, Cover, InfoRow, NA } from "@/components/ui";
import { allManga, getManga, getPerson, mangaRelations, mangaUrl, personUrl } from "@/lib/catalog";
import { getViewer } from "@/lib/viewer";

export async function generateMetadata(props: PageProps<"/manga/[id]/[name]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `${allManga.find((m) => m.id === Number(id))?.title ?? "Manga"} (Manga)` };
}

export default async function MangaPage(props: PageProps<"/manga/[id]/[name]">) {
  const { id } = await props.params;
  const viewer = await getViewer();
  const m = getManga(Number(id), viewer.asOf);
  if (!m) notFound();
  const relations = mangaRelations(m, viewer.asOf);

  return (
    <>
      <Breadcrumb items={[{ label: "Manga", href: "/manga" }, { label: m.title }]} />
      <div className="page left-side">
        <aside className="sidebar">
          <Cover title={m.title} />
          <div className="list-actions">
            <FavoriteButton account={viewer.account} kind="manga" id={m.id} back={mangaUrl(m)} />
          </div>
          <div className="side-card">
            <div className="side-head">Information</div>
            <div className="side-body info-list">
              <InfoRow k="Type">{m.type}</InfoRow>
              <InfoRow k="Volumes">{m.volumes ?? <NA>Unknown</NA>}</InfoRow>
              <InfoRow k="Chapters">{m.chapters ?? <NA>Unknown</NA>}</InfoRow>
              <InfoRow k="Status">{m.status ?? <NA>Not documented</NA>}</InfoRow>
              <InfoRow k="Published">{m.published ?? <NA>Not documented</NA>}</InfoRow>
              <InfoRow k="Genres">{m.genres.join(", ")}</InfoRow>
              <InfoRow k="Authors">
                {m.authors.map((a) => {
                  const p = getPerson(a.personId, viewer.asOf);
                  return p ? (
                    <span key={a.personId}>
                      <Link href={personUrl(p)}>{p.name}</Link> ({a.role})
                    </span>
                  ) : null;
                })}
              </InfoRow>
              <InfoRow k="Serialization">{m.serialization ?? <NA>Not documented</NA>}</InfoRow>
            </div>
          </div>
        </aside>
        <main>
          <div className="page-title">
            <h1>
              {m.title}
              {m.titleJapanese && <small>{m.titleJapanese}</small>}
            </h1>
          </div>
          <div className="box">
            <div className="box-head">Synopsis</div>
            <div className="box-body">{m.synopsis ? <p>{m.synopsis}</p> : <p><NA>No synopsis has been added for this title.</NA></p>}</div>
          </div>
          <div className="box">
            <div className="box-head">Related Entries</div>
            {relations.length ? (
              <table className="yal-table">
                <tbody>
                  {relations.map((r) => (
                    <tr key={r.url}>
                      <td style={{ width: 110 }}>
                        <b>{r.kind}:</b>
                      </td>
                      <td>
                        <Link href={r.url}>{r.title}</Link> <span className="muted">({r.type})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">No related entries.</div>
            )}
          </div>
          <ArchiveNote>
            YAL&apos;s episode threads discuss this manga as the source of the 2013 anime. Volume counts, serialization and publication dates have not been documented.
          </ArchiveNote>
          <div className="box">
            <div className="box-head">Discussion</div>
            <div className="box-body">
              <Link href="/forum/board/manga">Manga Discussion board</Link> &middot; remember to use spoiler tags!
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
