import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle, SectionNav } from "@/components/SectionNav";
import { Portrait } from "@/components/ui";
import { personStaffCredits, personUrl, personVoiceCredits, visiblePeople } from "@/lib/catalog";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "People" };

export default async function PeopleIndex(props: PageProps<"/people">) {
  const sp = await props.searchParams;
  const { asOf } = await getViewer();
  const role = (Array.isArray(sp.role) ? sp.role[0] : sp.role) ?? "";
  const people = visiblePeople(asOf)
    .filter((p) => !role || (role === "va" ? p.occupations.includes("Voice actor") : !p.occupations.includes("Voice actor")))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <Breadcrumb items={[{ label: "Industry", href: "/industry" }, { label: "People" }]} />
      <div className="page single">
        <main>
          <PageTitle title="People" attached />
          <SectionNav section="industry" active="/people" />
          <div className="controls" style={{ borderTop: "none" }}>
            <Link href="/people" className="btn">
              Everyone
            </Link>
            <Link href="/people?role=staff" className="btn">
              Staff &amp; Creators
            </Link>
            <Link href="/people?role=va" className="btn">
              Voice Actors
            </Link>
          </div>
          <div className="box" style={{ marginTop: 15 }}>
            <table className="yal-table">
              <tbody>
                {people.map((p) => {
                  const credits = personStaffCredits(p, asOf).length + personVoiceCredits(p, asOf).length;
                  return (
                    <tr key={p.id}>
                      <td style={{ width: 52 }}>
                        <Portrait name={p.name} id={p.id} />
                      </td>
                      <td>
                        <Link href={personUrl(p)}>
                          <b>{p.name}</b>
                        </Link>
                        {p.nativeName && <span className="muted"> ({p.nativeName})</span>}
                        <span className="sub">{p.occupations.join(", ")}</span>
                      </td>
                      <td className="num muted">
                        {credits} credit{credits === 1 ? "" : "s"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </>
  );
}
