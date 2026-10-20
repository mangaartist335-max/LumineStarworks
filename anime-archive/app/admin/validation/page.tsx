import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { IssueList } from "@/components/archive/issue-list";
import { EmptyState } from "@/components/archive/empty-state";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { loadArchive } from "@/lib/archive/server";
import { validateArchive, type IssueLevel, type ValidationIssue } from "@/lib/archive/validation";

export const metadata = { title: "Timeline validation" };

export default async function ValidationPage({ searchParams }: PageProps<"/admin/validation">) {
  const { level, provenance } = await searchParams;
  const minLevel = (level === "error" || level === "warning" || level === "info" ? level : "warning") as IssueLevel;
  const showProposed = provenance !== "hide";
  const index = await loadArchive();
  const order: Record<IssueLevel, number> = { error: 0, warning: 1, info: 2 };
  const issues = validateArchive(index.tables).filter((i) => order[i.level] <= order[minLevel]);

  const byProduction = new Map<string, ValidationIssue[]>();
  for (const issue of issues) {
    const productionId =
      issue.entity_type === "production"
        ? issue.entity_id
        : issue.entity_type === "broadcast_run"
          ? index.runsById.get(issue.entity_id)?.production_id
          : index.tables.episode_releases.find((r) => r.id === issue.entity_id)
            ? index.runsById.get(index.tables.episode_releases.find((r) => r.id === issue.entity_id)!.broadcast_run_id)?.production_id
            : undefined;
    if (!productionId) continue;
    byProduction.set(productionId, [...(byProduction.get(productionId) ?? []), issue]);
  }
  const groups = [...byProduction]
    .map(([id, list]) => ({ production: index.productionsById.get(id)!, list }))
    .filter((g) => g.production && (showProposed || g.production.provenance !== "proposed"))
    .sort((a, b) => Math.min(...a.list.map((i) => order[i.level])) - Math.min(...b.list.map((i) => order[i.level])) || a.production.title.localeCompare(b.production.title));

  const count = (l: IssueLevel) => issues.filter((i) => i.level === l).length;

  return (
    <>
      <AdminHeader
        title="Timeline validation"
        description="Checks broadcast weekdays, expected episode counts, skipped weeks and hiatuses, multi-cour spans, simultaneous regional broadcasts, film vs. television releases, conflicting dates and duplicate productions."
      />
      <form className="mb-6 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="val-level" className="text-xs text-muted-foreground">
            Show
          </label>
          <NativeSelect id="val-level" name="level" defaultValue={minLevel} className="w-52">
            <option value="error">Errors only</option>
            <option value="warning">Errors and warnings</option>
            <option value="info">Everything, including notes</option>
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="val-prov" className="text-xs text-muted-foreground">
            Records
          </label>
          <NativeSelect id="val-prov" name="provenance" defaultValue={showProposed ? "" : "hide"} className="w-52">
            <option value="">Include proposed samples</option>
            <option value="hide">Hide proposed samples</option>
          </NativeSelect>
        </div>
        <Button type="submit" variant="outline">
          Update
        </Button>
        <p className="ml-auto text-sm text-muted-foreground">
          {count("error")} errors · {count("warning")} warnings{minLevel === "info" ? ` · ${count("info")} notes` : ""}
        </p>
      </form>
      {groups.length === 0 ? (
        <EmptyState title="Everything lines up" description="No timeline problems at this level. Lovely." />
      ) : (
        <ul className="space-y-4">
          {groups.map(({ production, list }) => (
            <li key={production.id} className="space-y-3 rounded-xl border bg-card/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/admin/productions/${production.id}?tab=broadcast`} className="font-semibold hover:text-primary">
                  {production.title}
                </Link>
                <ProvenanceBadge provenance={production.provenance} />
              </div>
              <IssueList issues={list} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
