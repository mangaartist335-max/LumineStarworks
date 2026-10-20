import { stableId } from "../../lib/archive/ids";
import type { ArchiveTables, Revision } from "../../lib/archive/types";
import { mergeTables } from "./builder";
import { buildEstablished, ESTABLISHED_SOURCE_SLUG } from "./established";
import { buildProposed, PROPOSED_SOURCE_SLUG } from "./proposed";

export { ESTABLISHED_SOURCE_SLUG, PROPOSED_SOURCE_SLUG };

/**
 * The complete seed archive: the established chronology first (so it always
 * wins any id collision), then the proposed sample catalogue, plus one
 * "import" revision per production so every record starts with a history.
 */
export function buildSeedTables(): ArchiveTables {
  const tables = mergeTables(buildEstablished(), buildProposed());

  const sourceBySlug = new Map(tables.source_documents.map((d) => [d.slug, d.id]));
  const established = sourceBySlug.get(ESTABLISHED_SOURCE_SLUG)!;
  const proposed = sourceBySlug.get(PROPOSED_SOURCE_SLUG)!;

  const revisions: Revision[] = tables.productions.map((p) => ({
    id: stableId("revisions", `seed:${p.id}`),
    batch_id: stableId("revision_batches", p.provenance === "confirmed" ? "seed:established" : "seed:proposed"),
    entity_type: "production",
    entity_id: p.id,
    action: "import",
    summary:
      p.provenance === "confirmed"
        ? "Recorded from the archive development brief."
        : "Added from the sample catalogue as a Proposed entry.",
    before: null,
    after: { ...p },
    changed_fields: [],
    author: "Archive seed",
    source_document_id: p.provenance === "confirmed" ? established : proposed,
    created_at: p.created_at,
  }));
  tables.revisions.push(...revisions);
  return tables;
}
