import { AdminHeader } from "@/components/admin/admin-header";
import { EntityForm } from "@/components/admin/entity-form";
import { referenceOptions, sourceOptions } from "@/lib/admin/references";
import { loadArchive } from "@/lib/archive/server";

export const metadata = { title: "Add a production" };

export default async function NewProductionPage({ searchParams }: PageProps<"/admin/productions/new">) {
  const { format, franchise } = await searchParams;
  const index = await loadArchive();
  const isFilm = format === "film";
  return (
    <>
      <AdminHeader
        title={isFilm ? "Add a theatrical film" : "Add an anime production"}
        description="Start with what the source documents confirm. You can add broadcast runs, staff, cast and music on the next screen."
      />
      <EntityForm
        entity="production"
        values={{ format: isFilm ? "film" : "tv", provenance: "provisional", franchise_id: typeof franchise === "string" ? franchise : "" }}
        references={referenceOptions(index)}
        sources={sourceOptions(index)}
        submitLabel={isFilm ? "Create film entry" : "Create production"}
        redirectCreated="/admin/productions/{id}"
      />
    </>
  );
}
