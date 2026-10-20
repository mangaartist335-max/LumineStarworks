"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { setProvenanceAction } from "@/app/admin/actions";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { FORMAT_SHORT, PROVENANCE_LABEL } from "@/lib/archive/labels";
import { PROVENANCE_STATUSES, type ProductionFormat, type Provenance } from "@/lib/archive/types";
import { ActionForm } from "./action-form";

export interface AdminProductionRow {
  id: string;
  slug: string;
  title: string;
  format: ProductionFormat;
  provenance: Provenance;
  year: number | null;
  studio: string;
  issues: number;
  conflicts: number;
}

export function ProductionTable({ rows, initialProvenance }: { rows: AdminProductionRow[]; initialProvenance: Provenance | "" }) {
  const [q, setQ] = useState("");
  const [provenance, setProvenance] = useState<Provenance | "">(initialProvenance);
  const [selected, setSelected] = useState<string[]>([]);
  const [target, setTarget] = useState<Provenance>("confirmed");

  const shown = useMemo(
    () =>
      rows.filter((r) => (!provenance || r.provenance === provenance) && (!q || `${r.title} ${r.studio} ${r.year ?? ""}`.toLowerCase().includes(q.toLowerCase()))),
    [rows, q, provenance],
  );
  const allSelected = shown.length > 0 && shown.every((r) => selected.includes(r.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <label htmlFor="admin-q" className="sr-only">
            Search productions
          </label>
          <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="admin-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, studio or year" className="pl-8" />
        </div>
        <label htmlFor="admin-prov" className="sr-only">
          Status
        </label>
        <NativeSelect id="admin-prov" value={provenance} onChange={(e) => setProvenance(e.target.value as Provenance | "")} className="w-44">
          <option value="">Every status</option>
          {PROVENANCE_STATUSES.map((p) => (
            <option key={p} value={p}>
              {PROVENANCE_LABEL[p]}
            </option>
          ))}
        </NativeSelect>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-accent/40 p-3 text-sm">
          <span className="font-medium">{selected.length} selected</span>
          <ActionForm
            action={setProvenanceAction}
            fields={{ __entity: "production", ids: selected, provenance: target }}
            label={`Mark as ${PROVENANCE_LABEL[target]}`}
            variant="default"
            confirm={`Change the status of ${selected.length} production(s) and their credits to ${PROVENANCE_LABEL[target]}?`}
          >
            <label htmlFor="bulk-status" className="sr-only">
              New status
            </label>
            <NativeSelect id="bulk-status" value={target} onChange={(e) => setTarget(e.target.value as Provenance)} className="w-40">
              {PROVENANCE_STATUSES.map((p) => (
                <option key={p} value={p}>
                  {PROVENANCE_LABEL[p]}
                </option>
              ))}
            </NativeSelect>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input type="checkbox" name="cascade" defaultChecked className="size-4 accent-[var(--primary)]" /> include their credits & broadcast runs
            </label>
          </ActionForm>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  aria-label="Select all shown"
                  checked={allSelected}
                  onChange={(e) => setSelected(e.target.checked ? [...new Set([...selected, ...shown.map((r) => r.id)])] : selected.filter((id) => !shown.some((r) => r.id === id)))}
                  className="size-4 accent-[var(--primary)]"
                />
              </th>
              <th className="px-3 py-2.5">Title</th>
              <th className="px-3 py-2.5">Format</th>
              <th className="px-3 py-2.5">Year</th>
              <th className="px-3 py-2.5">Studio</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Checks</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shown.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label={`Select ${r.title}`}
                    checked={selected.includes(r.id)}
                    onChange={(e) => setSelected(e.target.checked ? [...selected, r.id] : selected.filter((id) => id !== r.id))}
                    className="size-4 accent-[var(--primary)]"
                  />
                </td>
                <td className="px-3 py-2">
                  <Link href={`/admin/productions/${r.id}`} className="font-medium hover:text-primary">
                    {r.title}
                  </Link>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{FORMAT_SHORT[r.format]}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">{r.year ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.studio || "—"}</td>
                <td className="px-3 py-2">
                  <ProvenanceBadge provenance={r.provenance} />
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.conflicts > 0 && <span className="mr-2 text-destructive">{r.conflicts} conflict</span>}
                  {r.issues > 0 ? <span className="text-prov-proposed">{r.issues} to check</span> : r.conflicts === 0 && <span className="text-muted-foreground">OK</span>}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  No productions match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
