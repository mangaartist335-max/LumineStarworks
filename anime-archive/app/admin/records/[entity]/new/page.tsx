import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { EntityForm } from "@/components/admin/entity-form";
import { referenceOptions, sourceOptions } from "@/lib/admin/references";
import { isRecordEntity, RECORD_COPY } from "@/lib/admin/records";
import { todayISO } from "@/lib/archive/dates";
import { loadArchive } from "@/lib/archive/server";

export default async function NewRecordPage({ params }: PageProps<"/admin/records/[entity]/new">) {
  const { entity } = await params;
  if (!isRecordEntity(entity)) notFound();
  const index = await loadArchive();
  const copy = RECORD_COPY[entity];
  const defaults: Record<string, string> = { provenance: entity === "source_document" ? "confirmed" : "provisional" };
  if (entity === "source_document") Object.assign(defaults, { kind: "production_document", received_at: todayISO() });
  if (entity === "company") defaults.kind = "production";
  if (entity === "music_track") defaults.kind = "song";

  return (
    <>
      <AdminHeader title={`Add ${copy.singular}`} description={copy.description} />
      <EntityForm
        entity={entity}
        values={defaults}
        references={referenceOptions(index)}
        sources={entity === "source_document" ? [] : sourceOptions(index)}
        submitLabel={`Create ${copy.singular}`}
        redirectCreated={`/admin/records/${entity}/{id}`}
      />
    </>
  );
}
