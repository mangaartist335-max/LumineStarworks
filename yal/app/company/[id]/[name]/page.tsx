import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AnimeEntry } from "@/components/anime/AnimeEntry";
import { allCompanies, companyWorks, getCompany } from "@/lib/catalog";
import { getViewer } from "@/lib/viewer";

export async function generateMetadata(props: PageProps<"/company/[id]/[name]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: allCompanies.find((c) => c.id === Number(id))?.name ?? "Company" };
}

export default async function CompanyPage(props: PageProps<"/company/[id]/[name]">) {
  const { id } = await props.params;
  const { asOf } = await getViewer();
  const c = getCompany(Number(id), asOf);
  if (!c) notFound();
  const works = companyWorks(c, asOf);

  return (
    <>
      <Breadcrumb items={[{ label: "Industry", href: "/industry" }, { label: "Studios & Companies", href: "/industry?view=studios" }, { label: c.name }]} />
      <div className="page">
        <main>
          <div className="page-title">
            <h1>{c.name}</h1>
            <div className="subtitle">{c.kinds.join(" · ")}</div>
          </div>
          {(c.about || c.foundedNote) && (
            <div className="box">
              <div className="box-head">About</div>
              <div className="box-body">
                {c.about && <p>{c.about}</p>}
                {c.foundedNote && <p className="muted">{c.foundedNote}</p>}
              </div>
            </div>
          )}
          <div className="box">
            <div className="box-head">Anime ({works.length})</div>
            <div className="entry-list">
              {works.length ? (
                works.map((w) => (
                  <AnimeEntry key={w.anime.id} anime={w.anime} asOf={asOf} extra={<div className="meta">Role: {w.roles.join(", ")}</div>} />
                ))
              ) : (
                <div className="empty">No anime credits are documented for this company at this point in time.</div>
              )}
            </div>
          </div>
        </main>
        <aside className="sidebar">
          <div className="side-card">
            <div className="side-head">Information</div>
            <div className="side-body">
              <table>
                <tbody>
                  <tr>
                    <td className="k">Type</td>
                    <td>{c.kinds.join(", ")}</td>
                  </tr>
                  <tr>
                    <td className="k">Titles</td>
                    <td>{works.length}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="side-card">
            <div className="side-head">Sources</div>
            <div className="side-body">
              <ul>
                {c.sources.map((s) => (
                  <li key={s.cite}>{s.cite}</li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
