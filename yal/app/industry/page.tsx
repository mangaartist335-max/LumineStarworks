import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle, SectionNav } from "@/components/SectionNav";
import { companyUrl, companyWorks, personStaffCredits, personUrl, visibleCompanies, visiblePeople } from "@/lib/catalog";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Industry" };

const GROUPS = ["Studio", "Producer", "Licensor", "Distributor", "Broadcaster", "Streaming", "Record label", "Publisher"] as const;

export default async function IndustryPage(props: PageProps<"/industry">) {
  const sp = await props.searchParams;
  const view = (Array.isArray(sp.view) ? sp.view[0] : sp.view) ?? "";
  const { asOf } = await getViewer();
  const companies = visibleCompanies(asOf);
  const staff = visiblePeople(asOf).filter((p) => !p.occupations.includes("Voice actor"));

  return (
    <>
      <Breadcrumb items={[{ label: "Industry" }]} />
      <div className="page">
        <main>
          <PageTitle title={view === "studios" ? "Studios & Companies" : "Industry"} attached />
          <SectionNav section="industry" active={view === "studios" ? "/industry?view=studios" : "/industry"} />
          <div className="box" style={{ borderTop: "none" }}>
            <div className="box-body">
              <p className="mt-0">
                Studios, producers, licensors and broadcasters, plus the people behind each production. A person can hold many
                credits across many titles, and a company keeps a single record however many roles it plays.
              </p>
            </div>
          </div>
          {GROUPS.map((g) => {
            const list = companies.filter((c) => c.kinds.includes(g));
            if (list.length === 0) return null;
            return (
              <div className="box" key={g}>
                <div className="box-head">{g === "Streaming" ? "Streaming services" : `${g}s`}</div>
                <table className="yal-table">
                  <tbody>
                    {list.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <Link href={companyUrl(c)}>
                            <b>{c.name}</b>
                          </Link>
                          {c.about && <span className="sub">{c.about.split(". ")[0]}.</span>}
                        </td>
                        <td className="num muted">{companyWorks(c, asOf).length} titles</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </main>
        <aside className="sidebar">
          <div className="side-card">
            <div className="side-head">Key Staff</div>
            <div className="side-body">
              <ul>
                {staff.map((p) => (
                  <li key={p.id}>
                    <Link href={personUrl(p)}>{p.name}</Link> <span className="muted">({personStaffCredits(p, asOf).length})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="side-card">
            <div className="side-head">Browse</div>
            <div className="side-body">
              <ul>
                <li>
                  <Link href="/people?role=staff">All staff &amp; creators</Link>
                </li>
                <li>
                  <Link href="/people?role=va">Voice actors</Link>
                </li>
                <li>
                  <Link href="/manga">Manga</Link>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
