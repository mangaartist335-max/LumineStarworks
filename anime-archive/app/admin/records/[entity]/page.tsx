import { ExternalLink, Plus, Search } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isRecordEntity, listRecords, RECORD_COPY } from "@/lib/admin/records";
import { loadArchive } from "@/lib/archive/server";

export default async function RecordListPage({ params, searchParams }: PageProps<"/admin/records/[entity]">) {
  const { entity } = await params;
  if (!isRecordEntity(entity)) notFound();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().toLowerCase() : "";
  const index = await loadArchive();
  const copy = RECORD_COPY[entity];
  const rows = listRecords(index, entity).filter((r) => !query || `${r.title} ${r.subtitle}`.toLowerCase().includes(query));

  return (
    <>
      <AdminHeader title={copy.plural} description={copy.description}>
        <Button asChild>
          <Link href={`/admin/records/${entity}/new`}>
            <Plus aria-hidden /> Add {copy.singular}
          </Link>
        </Button>
      </AdminHeader>
      <form className="relative mb-4 max-w-md">
        <label htmlFor="record-q" className="sr-only">
          Search
        </label>
        <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input id="record-q" name="q" defaultValue={typeof q === "string" ? q : ""} placeholder={`Search ${copy.plural.toLowerCase()}…`} className="pl-8" />
      </form>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5">Name</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-right">Linked</th>
              <th className="px-3 py-2.5">
                <span className="sr-only">Public page</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Link href={`/admin/records/${entity}/${r.id}`} className="font-medium hover:text-primary">
                    {r.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{r.subtitle}</p>
                </td>
                <td className="px-3 py-2">
                  <ProvenanceBadge provenance={r.provenance} />
                </td>
                <td className="px-3 py-2 text-right font-mono">{r.uses}</td>
                <td className="px-3 py-2 text-right">
                  {r.publicHref && (
                    <Link href={r.publicHref} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <ExternalLink aria-hidden className="size-3.5" /> View
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-muted-foreground">
                  Nothing found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
