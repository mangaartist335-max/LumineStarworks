import type { Metadata } from "next";
import { PageHeader } from "@/components/archive/page-header";
import { StaffDirectory, type StaffRow } from "@/components/directory/staff-directory";
import { loadArchive } from "@/lib/archive/server";
import { OCCUPATIONS, type Occupation } from "@/lib/archive/types";

export const metadata: Metadata = {
  title: "Staff directory",
  description: "Directors, writers, composers, animators, character designers, voice actors, producers and sound directors.",
};

export default async function StaffPage({ searchParams }: PageProps<"/staff">) {
  const { role } = await searchParams;
  const index = await loadArchive();
  const rows: StaffRow[] = index.tables.people.map((person) => {
    const productions = [
      ...index.creditsForPerson(person.id).map((c) => c.production),
      ...index.castForPerson(person.id).map((c) => c.production),
      ...index.trackCreditsForPerson(person.id).flatMap((c) => index.usagesForTrack(c.track.id).map((u) => u.production)),
    ];
    const unique = [...new Map(productions.map((p) => [p.id, p])).values()];
    const years = unique.map((p) => p.premiere_year).filter((y): y is number => y !== null);
    return {
      slug: person.slug,
      name: person.name,
      name_native: person.name_native,
      aliases: person.aliases,
      occupations: person.occupations,
      provenance: person.provenance,
      credits: unique.length,
      from: years.length ? Math.min(...years) : null,
      to: years.length ? Math.max(...years) : null,
      highlight: unique[0]?.title ?? null,
    };
  });
  const initialRole = typeof role === "string" && (OCCUPATIONS as readonly string[]).includes(role) ? (role as Occupation) : "";

  return (
    <>
      <PageHeader
        eyebrow="Staff directory"
        title="The people behind the productions"
        description="One profile per person, however many productions and roles they've worked on."
      />
      <div className="container-page py-10">
        <StaffDirectory people={rows} initialRole={initialRole} />
      </div>
    </>
  );
}
