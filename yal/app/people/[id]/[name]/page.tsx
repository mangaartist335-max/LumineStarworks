import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FavoriteButton } from "@/components/FavoriteButton";
import { NA, Portrait, fmtNum } from "@/components/ui";
import {
  allPeople,
  animeUrl,
  animeYear,
  characterUrl,
  getPerson,
  mangaUrl,
  personMangaCredits,
  personStaffCredits,
  personUrl,
  personVoiceCredits,
} from "@/lib/catalog";
import { favoritesCount } from "@/lib/members";
import { getViewer } from "@/lib/viewer";

export async function generateMetadata(props: PageProps<"/people/[id]/[name]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: allPeople.find((p) => p.id === Number(id))?.name ?? "People" };
}

export default async function PersonPage(props: PageProps<"/people/[id]/[name]">) {
  const { id } = await props.params;
  const viewer = await getViewer();
  const { asOf } = viewer;
  const p = getPerson(Number(id), asOf);
  if (!p) notFound();
  const staff = personStaffCredits(p, asOf);
  const voices = personVoiceCredits(p, asOf);
  const mangaCredits = personMangaCredits(p, asOf);
  const favorites = await favoritesCount("people", p.id, asOf);

  return (
    <>
      <Breadcrumb items={[{ label: "Industry", href: "/industry" }, { label: "People", href: "/people" }, { label: p.name }]} />
      <div className="page left-side">
        <aside className="sidebar">
          <Portrait name={p.name} id={p.id} large />
          <div className="list-actions">
            <FavoriteButton account={viewer.account} kind="people" id={p.id} back={personUrl(p)} />
          </div>
          <div className="side-card">
            <div className="side-head">Information</div>
            <div className="side-body info-list">
              <div className="row">
                <span className="k">Name:</span>
                {p.name}
              </div>
              <div className="row">
                <span className="k">Native name:</span>
                {p.nativeName ?? <NA>Not documented</NA>}
              </div>
              <div className="row">
                <span className="k">Occupation:</span>
                {p.occupations.join(", ")}
              </div>
              <div className="row">
                <span className="k">Member favorites:</span>
                {fmtNum(favorites)}
              </div>
            </div>
          </div>
        </aside>
        <main>
          <div className="page-title">
            <h1>
              {p.name}
              {p.nativeName && <small>{p.nativeName}</small>}
            </h1>
          </div>
          {p.about && (
            <div className="box">
              <div className="box-head">About</div>
              <div className="box-body">
                <p>{p.about}</p>
              </div>
            </div>
          )}

          {voices.length > 0 && (
            <div className="box">
              <div className="box-head">Voice Acting Roles</div>
              <table className="yal-table">
                <tbody>
                  {voices.map((v) => (
                    <tr key={`${v.anime.id}-${v.character.id}`}>
                      <td>
                        <Link href={animeUrl(v.anime)}>{v.anime.title}</Link>
                        <span className="sub">{animeYear(v.anime) ?? ""}</span>
                      </td>
                      <td className="right">
                        <Link href={characterUrl(v.character)}>{v.character.name}</Link>
                        <span className="sub">{v.language}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="box">
            <div className="box-head">Anime Staff Positions</div>
            {staff.length ? (
              <table className="yal-table">
                <tbody>
                  {staff.map((s) => (
                    <tr key={`${s.anime.id}-${s.role}`}>
                      <td>
                        <Link href={animeUrl(s.anime)}>{s.anime.title}</Link>
                        <span className="sub">
                          {s.anime.type === "Unknown" ? "Format not documented" : s.anime.type}
                          {animeYear(s.anime) !== null ? ` · ${animeYear(s.anime)}` : ""}
                        </span>
                      </td>
                      <td className="muted">
                        {s.role}
                        {s.note && ` (${s.note})`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">No staff positions are documented.</div>
            )}
          </div>

          {mangaCredits.length > 0 && (
            <div className="box">
              <div className="box-head">Published Manga</div>
              <table className="yal-table">
                <tbody>
                  {mangaCredits.map((m) => (
                    <tr key={m.manga.id}>
                      <td>
                        <Link href={mangaUrl(m.manga)}>{m.manga.title}</Link>
                      </td>
                      <td className="muted">{m.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="hint">Sources: {p.sources.map((s) => s.cite).join("; ")}</p>
        </main>
      </div>
    </>
  );
}
