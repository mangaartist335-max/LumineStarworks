"use client";

import { CircleCheck, FileJson, GitPullRequestArrow, LoaderCircle, OctagonAlert, Upload } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { importAction, type ImportState } from "@/app/admin/actions";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PlannedChange } from "@/lib/archive/import-export";
import { ENTITY_LABEL } from "@/lib/archive/labels";

function show(value: unknown): string {
  if (value === null || value === undefined) return "—";
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function ImportPanel({ example }: { example: string }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importAction, {});
  const [text, setText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const plan = state.plan;
  const canApply = plan && plan.errors.length === 0 && plan.creates.length + plan.updates.length + plan.conflicts.length > 0 && !state.applied;

  return (
    <div className="space-y-8">
      <form ref={formRef} action={action} className="space-y-4 rounded-xl border bg-card/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="import-json" className="font-semibold">
            Archive JSON
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setText(example)}>
              <FileJson aria-hidden /> Load example
            </Button>
            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-xs font-medium hover:bg-accent">
              <Upload aria-hidden className="size-4" /> Choose file
              <input
                type="file"
                name="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) setText(await file.text());
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
        <Textarea
          id="import-json"
          name="json"
          value={text || state.json || ""}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          spellCheck={false}
          placeholder='{ "format": "lumine-archive", "version": 1, "source": { "title": "…" }, "tables": { "productions": [ … ] } }'
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          References can use slugs instead of ids (for example <code className="font-mono">&quot;person_id&quot;: &quot;kaihatsu-miura&quot;</code>). Rows without a{" "}
          <code className="font-mono">provenance</code> use the document&apos;s <code className="font-mono">source.provenance</code> (Provisional by default).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" name="intent" value="preview" variant="outline" disabled={pending}>
            {pending ? <LoaderCircle aria-hidden className="animate-spin" /> : null} Preview import
          </Button>
          <Button type="submit" name="intent" value="apply" disabled={pending || !canApply}>
            Apply import
          </Button>
          {!plan && <span className="text-xs text-muted-foreground">Preview first — nothing is saved until you apply.</span>}
        </div>
        {state.error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
        {state.applied && (
          <p role="status" className="flex items-center gap-2 rounded-md border border-prov-confirmed/40 bg-prov-confirmed/10 px-3 py-2 text-sm">
            <CircleCheck aria-hidden className="size-4 text-prov-confirmed" />
            Imported: {state.applied.created} created, {state.applied.updated} updated, {state.applied.conflicts} sent to conflict review.
            {state.applied.conflicts > 0 && (
              <Link href="/admin/conflicts" className="font-medium underline">
                Review conflicts
              </Link>
            )}
          </p>
        )}
      </form>

      {plan && (
        <section aria-labelledby="plan-heading" className="space-y-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="plan-heading" className="text-lg font-bold">
              {state.applied ? "What was imported" : "Import preview"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Source: <span className="font-medium text-foreground">{plan.source.title}</span> · default status <ProvenanceBadge provenance={plan.source.provenance} />
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["New records", plan.creates.length],
              ["Updates", plan.updates.length],
              ["Conflicts", plan.conflicts.length],
              ["Duplicates blocked", plan.duplicates.length],
              ["Unchanged", plan.unchanged],
            ].map(([label, n]) => (
              <div key={label} className="rounded-xl border bg-card/50 p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-mono text-2xl font-bold">{n}</p>
              </div>
            ))}
          </div>

          {plan.errors.length > 0 && (
            <PlanList title="Problems to fix before importing" tone="error">
              {plan.errors.map((e, i) => (
                <li key={i}>
                  <span className="font-medium">{e.label}</span> — {e.message}
                </li>
              ))}
            </PlanList>
          )}
          {plan.duplicates.length > 0 && (
            <PlanList title="Duplicates (won't be created)" tone="warning">
              {plan.duplicates.map((d, i) => (
                <li key={i}>
                  <span className="font-medium">{d.label}</span> — {d.reason}
                </li>
              ))}
            </PlanList>
          )}
          {plan.conflicts.length > 0 && (
            <PlanList title="Conflicts (sent to review, nothing overwritten)" tone="warning" icon={<GitPullRequestArrow aria-hidden className="size-4" />}>
              {plan.conflicts.map((c, i) => (
                <li key={i}>
                  <span className="font-medium">{c.label}</span> · <code className="font-mono text-xs">{c.field}</code>: on record <span className="font-mono">{show(c.current)}</span>, document says{" "}
                  <span className="font-mono">{show(c.proposed)}</span>. <span className="text-muted-foreground">{c.reason}</span>
                </li>
              ))}
            </PlanList>
          )}
          <ChangeList title="New records" items={plan.creates} />
          <ChangeList title="Updates" items={plan.updates} />
          {plan.notes.length > 0 && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {plan.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function PlanList({ title, tone, children, icon }: { title: string; tone: "error" | "warning"; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className={tone === "error" ? "rounded-xl border border-destructive/40 bg-destructive/5 p-4" : "rounded-xl border border-prov-proposed/40 bg-prov-proposed/5 p-4"}>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        {icon ?? <OctagonAlert aria-hidden className="size-4" />} {title}
      </h3>
      <ul className="list-disc space-y-1 pl-5 text-sm">{children}</ul>
    </div>
  );
}

function ChangeList({ title, items }: { title: string; items: PlannedChange[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border bg-card/40">
      <h3 className="border-b px-4 py-2.5 text-sm font-semibold">
        {title} ({items.length})
      </h3>
      <ul className="divide-y text-sm">
        {items.map((item) => (
          <li key={`${item.entity}-${item.id}`} className="px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-muted px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-muted-foreground">{ENTITY_LABEL[item.entity]}</span>
              <span className="font-medium">{item.label}</span>
              <ProvenanceBadge provenance={item.provenance} compact />
            </div>
            {item.action === "update" && (
              <ul className="mt-1 space-y-0.5 font-mono text-xs text-muted-foreground">
                {item.fields.map((f) => (
                  <li key={f.field}>
                    {f.field}: {show(f.from)} → <span className="text-foreground">{show(f.to)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
