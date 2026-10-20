import { Download, FileJson } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";
import { loadArchive } from "@/lib/archive/server";

export const metadata = { title: "Export" };

export default async function ExportPage() {
  const index = await loadArchive();
  const productions = [...index.tables.productions].sort((a, b) => a.title.localeCompare(b.title));
  return (
    <>
      <AdminHeader title="Export the archive" description="Exports use the same lumine-archive JSON format the importer reads, so they work as backups and as a way to move records between archives." />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border bg-card/50 p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <FileJson aria-hidden className="size-5 text-primary" /> Full archive
          </h2>
          <p className="text-sm text-muted-foreground">Every table, including revisions, conflicts and field-level citations.</p>
          <Button asChild>
            <a href="/api/export/archive" download>
              <Download aria-hidden /> Download with history
            </a>
          </Button>
        </div>
        <div className="space-y-3 rounded-xl border bg-card/50 p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <FileJson aria-hidden className="size-5 text-primary" /> Records only
          </h2>
          <p className="text-sm text-muted-foreground">Public records without the audit tables — handy for sharing with another archive.</p>
          <Button asChild variant="outline">
            <a href="/api/export/archive?audit=0" download>
              <Download aria-hidden /> Download records
            </a>
          </Button>
        </div>
      </div>
      <section className="mt-8 space-y-3">
        <h2 className="font-semibold">Single production</h2>
        <p className="text-sm text-muted-foreground">Exports one production with its studios, people, companies, music, broadcast runs and citations.</p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {productions.map((p) => (
            <li key={p.id}>
              <a href={`/api/export/production/${p.slug}`} download className="flex items-center justify-between gap-2 rounded-lg border bg-card/40 px-3 py-2 text-sm hover:border-primary/40">
                <span className="truncate">{p.title}</span>
                <Download aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
