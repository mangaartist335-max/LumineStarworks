import { Film, Mic2, Music } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InfoList, Panel, Pending } from "@/components/anime/info-list";
import { PageHeader } from "@/components/archive/page-header";
import { PosterArt } from "@/components/archive/poster-art";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CAST_TYPE_LABEL, CREDIT_ROLE_LABEL, LANGUAGE_LABEL, OCCUPATION_LABEL, THEME_USAGE_SHORT, TRACK_ROLE_LABEL } from "@/lib/archive/labels";
import { getPersonDetail } from "@/lib/archive/queries";
import { formatSeason } from "@/lib/archive/seasons";
import { archiveToday, loadArchive } from "@/lib/archive/server";
import { initials } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/staff/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const person = (await loadArchive()).peopleBySlug.get(slug);
  return { title: person ? person.name : "Person not found" };
}

export default async function PersonPage({ params }: PageProps<"/staff/[slug]">) {
  const { slug } = await params;
  const index = await loadArchive();
  const detail = getPersonDetail(index, slug, archiveToday());
  if (!detail) notFound();
  const { person } = detail;

  return (
    <>
      <PageHeader
        eyebrow="Staff profile"
        title={
          <span className="flex flex-wrap items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-accent text-xl font-black text-accent-foreground">{initials(person.name)}</span>
            <span>
              {person.name}
              {person.name_native && <span className="block font-jp text-lg font-semibold text-muted-foreground">{person.name_native}</span>}
            </span>
          </span>
        }
      >
        <ProvenanceBadge provenance={person.provenance} />
      </PageHeader>
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          <Panel title="Production credits">
            {detail.staffCredits.length === 0 ? (
              <Pending>No staff credits recorded.</Pending>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Production</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Studio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.staffCredits.map(({ summary, roles }) => (
                    <TableRow key={summary.id}>
                      <TableCell>
                        <Link href={`/anime/${summary.slug}`} className="flex items-center gap-3 font-medium hover:text-primary">
                          <span className="w-8 shrink-0">
                            <PosterArt slug={summary.slug} title="" format={summary.format} size="sm" className="rounded" />
                          </span>
                          <span>
                            {summary.title}
                            {summary.provenance !== "confirmed" && <ProvenanceBadge provenance={summary.provenance} compact className="ml-1.5 align-middle" />}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{summary.premiere ? formatSeason(summary.premiere) : (summary.premiere_year ?? "—")}</TableCell>
                      <TableCell>{roles.map((r) => CREDIT_ROLE_LABEL[r.role] + (r.detail ? ` (${r.detail})` : "")).join(", ")}</TableCell>
                      <TableCell className="text-muted-foreground">{summary.studios.map((s) => s.name).join(", ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Panel>

          {detail.castCredits.length > 0 && (
            <Panel title="Voice & performance roles">
              <ul className="grid gap-3 md:grid-cols-2">
                {detail.castCredits.map(({ credit, summary }) => (
                  <li key={credit.id}>
                    <Link href={`/anime/${summary.slug}`} className="flex items-center gap-3 rounded-xl border bg-card/50 p-3 hover:border-primary/40">
                      <Mic2 aria-hidden className="size-5 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{credit.character_name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {summary.title} · {credit.language ? `${LANGUAGE_LABEL[credit.language]} ` : ""}
                          {CAST_TYPE_LABEL[credit.credit_type].toLowerCase()}
                          {summary.premiere_year ? ` · ${summary.premiere_year}` : ""}
                        </span>
                        {credit.notes && <span className="block text-xs text-muted-foreground">{credit.notes}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {detail.music.length > 0 && (
            <Panel title="Music">
              <ul className="grid gap-3 md:grid-cols-2">
                {detail.music.map(({ credit, track, usages }) => (
                  <li key={credit.id} className="flex gap-3 rounded-xl border bg-card/50 p-3">
                    <Music aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block font-medium">“{track.title}”</span>
                      <span className="block text-xs text-muted-foreground">
                        {TRACK_ROLE_LABEL[credit.role]}
                        {credit.credited_as ? ` (credited as ${credit.credited_as})` : ""}
                      </span>
                      {usages.map((u) => (
                        <Link key={u.production.slug + u.usage} href={`/anime/${u.production.slug}`} className="block text-xs text-muted-foreground hover:text-primary">
                          {THEME_USAGE_SHORT[u.usage]} · {u.production.title}
                        </Link>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <aside className="space-y-8">
          <Panel title="Profile">
            <InfoList
              items={[
                { label: "Roles", value: person.occupations.map((o) => OCCUPATION_LABEL[o]).join(", ") },
                { label: "Also known as", value: person.aliases.join(", ") },
                { label: "Active", value: detail.active ? (detail.active.from === detail.active.to ? String(detail.active.from) : `${detail.active.from}–${detail.active.to}`) : null },
                { label: "Productions", value: detail.staffCredits.length + detail.castCredits.length || null },
              ]}
            />
            {person.bio ? <p className="text-sm leading-relaxed text-muted-foreground">{person.bio}</p> : <Pending>Biography not yet documented.</Pending>}
          </Panel>
          <Panel title="Studios worked with">
            {detail.studios.length === 0 ? (
              <Pending />
            ) : (
              <ul className="space-y-2">
                {detail.studios.map(({ studio, count }) => (
                  <li key={studio.id}>
                    <Link href={`/studios/${studio.slug}`} className="flex items-center justify-between rounded-lg border bg-card/50 px-3 py-2 text-sm hover:border-primary/40">
                      <span className="flex items-center gap-2 font-medium">
                        <Film aria-hidden className="size-4 text-primary" /> {studio.name}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">{count}×</span>
                    </Link>
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
