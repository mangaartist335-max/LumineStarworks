import { describe, expect, it } from "vitest";
import { buildSeedTables } from "@/data/seed";
import { applyChangeSet } from "@/lib/archive/changes";
import { applyImportPlan, exportArchive, ImportFormatError, parseArchiveDocument, planImport } from "@/lib/archive/import-export";
import type { ArchiveTables } from "@/lib/archive/types";

const fresh = () => structuredClone(buildSeedTables());
const doc = (tables: Record<string, unknown[]>, provenance = "provisional") => ({
  format: "lumine-archive",
  version: 1,
  source: { title: "Test production document", kind: "production_document", received_at: "2026-10-21", provenance },
  tables,
});
const apply = (tables: ArchiveTables, input: unknown) => {
  const plan = planImport(tables, input);
  return { plan, tables: applyChangeSet(tables, applyImportPlan(tables, plan, "Test").changes) };
};

describe("import safety rules", () => {
  it("never overwrites a confirmed fact — the newer value becomes a conflict", () => {
    const tables = fresh();
    const { plan, tables: after } = apply(tables, doc({ productions: [{ slug: "earth-metal-comet-season-2", episode_count: 24 }] }, "confirmed"));
    expect(plan.updates).toEqual([]);
    expect(plan.conflicts).toHaveLength(1);
    expect(after.productions.find((p) => p.slug === "earth-metal-comet-season-2")!.episode_count).toBe(22);
    const conflict = after.record_conflicts[0];
    expect([conflict.field, conflict.current_value, conflict.proposed_value, conflict.status, conflict.proposed_provenance]).toEqual(["episode_count", 22, 24, "open", "conflicting"]);
  });

  it("lets a newer source fill in fields a confirmed record doesn't have yet only through review", () => {
    const tables = fresh();
    const plan = planImport(tables, doc({ productions: [{ slug: "overture", premiere_date: "2019-08-30" }] }, "confirmed"));
    expect(plan.conflicts.map((c) => c.field)).toEqual(["premiere_date"]);
  });

  it("updates provisional records from an equally trustworthy source", () => {
    const tables = fresh();
    const seedImports = tables.revisions.filter((r) => r.action === "import").length;
    const { tables: first } = apply(tables, doc({ productions: [{ slug: "new-show", title: "New Show", format: "tv", episode_count: 12 }] }));
    const { plan, tables: second } = apply(first, doc({ productions: [{ slug: "new-show", episode_count: 13 }] }));
    expect(plan.updates).toHaveLength(1);
    expect(second.productions.find((p) => p.slug === "new-show")!.episode_count).toBe(13);
    // One revision for the create, one for the update.
    expect(second.revisions.filter((r) => r.action === "import").length).toBe(seedImports + 2);
  });

  it("sends lower-ranked sources to review instead of applying them", () => {
    const tables = fresh();
    const { tables: first } = apply(tables, doc({ productions: [{ slug: "new-show", title: "New Show", format: "tv", episode_count: 12 }] }, "provisional"));
    const plan = planImport(first, doc({ productions: [{ slug: "new-show", episode_count: 10 }] }, "proposed"));
    expect(plan.updates).toEqual([]);
    expect(plan.conflicts).toHaveLength(1);
  });

  it("promotes a Proposed record when a confirmed source arrives", () => {
    const tables = fresh();
    const plan = planImport(tables, doc({ productions: [{ slug: "stardust-relay", episode_count: 12 }] }, "confirmed"));
    expect(plan.updates[0].fields).toEqual([{ field: "provenance", from: "proposed", to: "confirmed" }]);
  });

  it("never erases a recorded value with an empty one", () => {
    const tables = fresh();
    const plan = planImport(tables, doc({ productions: [{ slug: "stardust-relay", synopsis: "", genres: [] }] }, "confirmed"));
    expect(plan.updates.flatMap((u) => u.fields.map((f) => f.field))).not.toContain("synopsis");
  });

  it("blocks duplicate productions", () => {
    const tables = fresh();
    const plan = planImport(tables, doc({ productions: [{ slug: "overture-again", title: "Overture", format: "film", premiere_year: 2019 }] }));
    expect(plan.creates).toEqual([]);
    expect(plan.duplicates).toHaveLength(1);
  });

  it("resolves slug references and records where every fact came from", () => {
    const tables = fresh();
    const { plan, tables: after } = apply(
      tables,
      doc({
        productions: [{ slug: "night-ferry", title: "Night Ferry", format: "tv" }],
        production_credits: [{ production_id: "night-ferry", person_id: "kaihatsu-miura", role: "director" }],
        broadcast_runs: [{ production_id: "night-ferry", kind: "tv", start_date: "2027-04-02", end_date: "2027-06-18", episode_count: 12 }],
      }),
    );
    expect(plan.errors).toEqual([]);
    expect(plan.creates).toHaveLength(3);
    const source = after.source_documents.find((d) => d.title === "Test production document")!;
    const production = after.productions.find((p) => p.slug === "night-ferry")!;
    expect(after.fact_sources.some((f) => f.entity_id === production.id && f.source_document_id === source.id)).toBe(true);
    expect(after.production_credits.some((c) => c.production_id === production.id)).toBe(true);
  });

  it("reports unknown references instead of guessing", () => {
    const plan = planImport(fresh(), doc({ production_credits: [{ production_id: "overture", person_id: "nobody-at-all", role: "director" }] }));
    expect(plan.errors[0].message).toMatch(/nobody-at-all/);
  });

  it("validates rows with the same rules as the editor", () => {
    const plan = planImport(fresh(), doc({ productions: [{ slug: "bad-dates", title: "Bad Dates", format: "tv", premiere_date: "2020-05-01", finale_date: "2020-04-01" }] }));
    expect(plan.errors[0].message).toMatch(/finale/i);
  });

  it("treats re-importing a full export as a no-op", () => {
    const tables = fresh();
    const plan = planImport(tables, JSON.parse(JSON.stringify(exportArchive(tables))));
    expect(plan.creates).toEqual([]);
    expect(plan.updates).toEqual([]);
    expect(plan.conflicts).toEqual([]);
  });

  it("does not raise a conflict that was already reviewed", () => {
    const tables = fresh();
    const input = doc({ productions: [{ slug: "earth-metal-comet-season-2", episode_count: 24 }] }, "confirmed");
    const { tables: after } = apply(tables, input);
    expect(planImport(after, input).conflicts).toEqual([]);
  });

  it("rejects documents in another format", () => {
    expect(() => parseArchiveDocument({ format: "something-else", tables: {} })).toThrow(ImportFormatError);
    expect(() => parseArchiveDocument({ tables: { mystery: [] } })).toThrow(/Unknown table/);
  });
});
