import { AdminHeader } from "@/components/admin/admin-header";
import { ImportPanel } from "@/components/admin/import-panel";
import { IMPORT_EXAMPLE } from "@/lib/admin/import-example";

export const metadata = { title: "Import JSON" };

export default function ImportPage() {
  return (
    <>
      <AdminHeader
        title="Import structured JSON"
        description="Bring in production documents, corrections or a full archive export. Every import is previewed first, cited as its own source document, and never overwrites a confirmed fact — disagreements go to conflict review."
      />
      <ImportPanel example={JSON.stringify(IMPORT_EXAMPLE, null, 2)} />
    </>
  );
}
