import "server-only";

import type { ArchiveIndex } from "@/lib/archive/archive-index";
import { formatDate } from "@/lib/archive/dates";
import type { Option } from "@/lib/archive/forms";
import { BROADCAST_KIND_LABEL, COMPANY_KIND_LABEL, FORMAT_SHORT, PROVENANCE_LABEL } from "@/lib/archive/labels";
import type { EntityType } from "@/lib/archive/types";

const byLabel = (a: Option, b: Option) => a.label.localeCompare(b.label);

/** Option lists for every reference field in the editor. Episodes and runs are scoped to one production. */
export function referenceOptions(index: ArchiveIndex, productionId?: string): Partial<Record<EntityType, Option[]>> {
  const t = index.tables;
  return {
    franchise: t.franchises.map((f) => ({ value: f.id, label: f.name })).sort(byLabel),
    studio: t.studios.map((s) => ({ value: s.id, label: s.name })).sort(byLabel),
    person: t.people.map((p) => ({ value: p.id, label: p.name_native ? `${p.name} (${p.name_native})` : p.name })).sort(byLabel),
    company: t.companies.map((c) => ({ value: c.id, label: `${c.name} — ${COMPANY_KIND_LABEL[c.kind]}` })).sort(byLabel),
    music_track: t.music_tracks.map((m) => ({ value: m.id, label: m.title })).sort(byLabel),
    production: t.productions
      .map((p) => ({ value: p.id, label: `${p.title} (${FORMAT_SHORT[p.format]}${p.premiere_year ? `, ${p.premiere_year}` : ""})` }))
      .sort(byLabel),
    episode: productionId ? index.episodesFor(productionId).map((e) => ({ value: e.id, label: `Episode ${e.number}${e.title ? ` — ${e.title}` : ""}` })) : [],
    broadcast_run: productionId
      ? index.runsFor(productionId).map((r) => ({ value: r.id, label: `${r.label ?? BROADCAST_KIND_LABEL[r.kind]}${r.start_date ? ` (from ${formatDate(r.start_date, "short")})` : ""}` }))
      : [],
  };
}

export function sourceOptions(index: ArchiveIndex): Option[] {
  return [...index.tables.source_documents]
    .sort((a, b) => (a.received_at < b.received_at ? 1 : -1))
    .map((d) => ({ value: d.id, label: `${d.title} · ${d.received_at}${d.provenance !== "confirmed" ? ` (${PROVENANCE_LABEL[d.provenance]})` : ""}` }));
}
