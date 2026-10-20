import { ArrowRight, FileText, Film, Handshake, Shuffle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InfoList, Panel, Pending } from "@/components/anime/info-list";
import { EmptyState } from "@/components/archive/empty-state";
import { PageHeader } from "@/components/archive/page-header";
import { ProductionRow } from "@/components/archive/production-card";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { CREDIT_ROLE_LABEL, STUDIO_ROLE_LABEL } from "@/lib/archive/labels";
import { getStudioDetail } from "@/lib/archive/queries";
import { archiveToday, loadArchive } from "@/lib/archive/server";
import { initials, plural } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/studios/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const studio = (await loadArchive()).studiosBySlug.get(slug);
  return { title: studio ? studio.name : "Studio not found" };
}

export default async function StudioPage({ params }: PageProps<"/studios/[slug]">) {
  const { slug } = await params;
  const index = await loadArchive();
  const detail = getStudioDetail(index, slug, archiveToday());
  if (!detail) notFound();
  const { studio } = detail;

  const byYear = new Map<string, typeof detail.filmography>();
  for (const entry of detail.filmography) {
    const key = String(entry.summary.premiere_year ?? "Undated");
    byYear.set(key, [...(byYear.get(key) ?? []), entry]);
  }

  return (
    <>
      <PageHeader
        eyebrow="Studio profile"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {studio.name} <ProvenanceBadge provenance={studio.provenance} />
          </span>
        }
        description={studio.name_native ? <span className="font-jp">{studio.name_native}</span> : undefined}
      />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-10">
          <Panel title={`Filmography (${detail.filmography.length})`}>
            {detail.filmography.length === 0 ? (
              <EmptyState icon={Film} title="No productions linked yet" />
            ) : (
              <ol className="space-y-6">
                {[...byYear].map(([year, entries]) => (
                  <li key={year} className="grid gap-3 md:grid-cols-[5rem_1fr]">
                    <p className="font-mono text-lg font-bold text-muted-foreground">{year}</p>
                    <div className="grid gap-3">
                      {entries.map(({ summary, role }) => (
                        <ProductionRow
                          key={summary.id}
                          production={summary}
                          extra={role !== "animation" && <p className="text-xs text-primary">{STUDIO_ROLE_LABEL[role]}</p>}
                        />
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="Major staff transitions">
            {detail.transitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No staff have moved between this studio and another one in the recorded credits.</p>
            ) : (
              <ul className="space-y-2">
                {detail.transitions.map((t, i) => (
                  <li key={`${t.person.id}-${i}`} className="flex flex-wrap items-center gap-2 rounded-lg border bg-card/50 px-4 py-3 text-sm">
                    <Shuffle aria-hidden className="size-4 text-primary" />
                    <Link href={`/staff/${t.person.slug}`} className="font-medium hover:text-primary">
                      {t.person.name}
                    </Link>
                    {t.direction === "moved" ? (
                      <span className="text-muted-foreground">
                        went on to work with{" "}
                        <Link href={`/studios/${t.other.slug}`} className="font-medium text-foreground hover:text-primary">
                          {t.other.name}
                        </Link>{" "}
                        on {t.via}
                        {t.year ? ` (${t.year})` : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        joined from{" "}
                        <Link href={`/studios/${t.other.slug}`} className="font-medium text-foreground hover:text-primary">
                          {t.other.name}
                        </Link>{" "}
                        for {t.via}
                        {t.year ? ` (${t.year})` : ""}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">Derived from production credits in chronological order.</p>
          </Panel>
        </div>

        <aside className="space-y-8">
          <Panel title="Studio facts">
            <InfoList
              items={[
                { label: "Founded", value: studio.founded_year },
                { label: "Location", value: studio.location },
                { label: "Founders", value: studio.founders.join(", ") },
                { label: "Animation style", value: studio.animation_style },
                { label: "Productions", value: detail.filmography.length },
              ]}
            />
            {studio.description && <p className="text-sm leading-relaxed text-muted-foreground">{studio.description}</p>}
          </Panel>

          <Panel title="Key staff">
            {detail.keyStaff.length === 0 ? (
              <Pending>No staff credits recorded yet.</Pending>
            ) : (
              <ul className="space-y-2">
                {detail.keyStaff.map(({ person, roles, productions }) => (
                  <li key={person.id}>
                    <Link href={`/staff/${person.slug}`} className="flex items-center gap-3 rounded-lg border bg-card/50 p-2.5 hover:border-primary/40">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{initials(person.name)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{person.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{roles.map((r) => CREDIT_ROLE_LABEL[r]).join(", ")}</span>
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">{productions}×</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Collaborations">
            {detail.collaborations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No co-productions or franchise hand-offs recorded.</p>
            ) : (
              <ul className="space-y-2">
                {detail.collaborations.map((c) => (
                  <li key={c.studio.id} className="rounded-lg border bg-card/50 p-3 text-sm">
                    <Link href={`/studios/${c.studio.slug}`} className="flex items-center gap-2 font-medium hover:text-primary">
                      <Handshake aria-hidden className="size-4 text-primary" /> {c.studio.name}
                    </Link>
                    {c.shared.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Co-produced {plural(c.shared.length, "title")}: {c.shared.join(", ")}</p>}
                    {c.handoffs.length > 0 && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <ArrowRight aria-hidden className="size-3" /> Shared franchise: {c.handoffs.join(", ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Sources">
            {detail.sources.length === 0 ? (
              <Pending />
            ) : (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {[...new Set(detail.sources.map((s) => s.document?.title).filter(Boolean))].map((t) => (
                  <li key={t} className="flex gap-2">
                    <FileText aria-hidden className="mt-0.5 size-3.5 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
