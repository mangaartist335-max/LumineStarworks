import { describe, expect, it } from "vitest";
import { buildSeedTables } from "@/data/seed";
import { applyChangeSet } from "@/lib/archive/changes";
import { createContext, createNextSeason, deleteEntity, resolveConflict, restoreBatch, restoreRevision, saveEntity, setProvenance } from "@/lib/archive/mutations";
import { schemas } from "@/lib/archive/schemas";
import type { ArchiveTables } from "@/lib/archive/types";

const fresh = () => structuredClone(buildSeedTables());
const studioInput = (name: string, slug: string) => schemas.studio.parse({ slug, name, name_native: null, founded_year: 2020, location: "Tokyo", founders: [], animation_style: null, description: null, provenance: "provisional" });

describe("editor mutations", () => {
  it("creates and updates records with a revision for each change", () => {
    let tables = fresh();
    const created = saveEntity(createContext(tables, "Editor"), "studio", studioInput("Studio Test", "studio-test"));
    tables = applyChangeSet(tables, created.changes);
    const updated = saveEntity(createContext(tables, "Editor"), "studio", { ...studioInput("Studio Test", "studio-test"), location: "Osaka" }, created.row.id);
    tables = applyChangeSet(tables, updated.changes);
    expect(updated.changed).toEqual(["location"]);
    const revisions = tables.revisions.filter((r) => r.entity_id === created.row.id);
    expect(revisions.map((r) => r.action).sort()).toEqual(["create", "update"]);
    expect(revisions.find((r) => r.action === "update")!.before).toMatchObject({ location: "Tokyo" });
  });

  it("refuses duplicate slugs", () => {
    const tables = fresh();
    expect(() => saveEntity(createContext(tables, "Editor"), "studio", studioInput("Another Burst", "studio-burst"))).toThrow(/highlighted/);
  });

  it("deletes a production with its credits and runs, and restores the whole batch", () => {
    let tables = fresh();
    const p = tables.productions.find((x) => x.slug === "earth-metal-comet-season-1")!;
    const ctx = createContext(tables, "Editor");
    tables = applyChangeSet(tables, deleteEntity(ctx, "production", p.id));
    expect(tables.productions.some((x) => x.id === p.id)).toBe(false);
    expect(tables.production_credits.some((c) => c.production_id === p.id)).toBe(false);
    expect(tables.related_media.some((r) => r.production_id === p.id || r.related_production_id === p.id)).toBe(false);

    tables = applyChangeSet(tables, restoreBatch(createContext(tables, "Editor"), ctx.batchId));
    expect(tables.productions.find((x) => x.id === p.id)?.title).toBe("EARTH: Metal Comet Season 1");
    expect(tables.production_credits.filter((c) => c.production_id === p.id)).toHaveLength(9);
    expect(tables.broadcast_runs.some((r) => r.production_id === p.id)).toBe(true);
  });

  it("won't delete a studio that productions still use", () => {
    const tables = fresh();
    const burst = tables.studios.find((s) => s.slug === "studio-burst")!;
    expect(() => deleteEntity(createContext(tables, "Editor"), "studio", burst.id)).toThrow(/still used/);
  });

  it("restores an earlier version of a record", () => {
    let tables = fresh();
    const studio = tables.studios.find((s) => s.slug === "studio-burst")!;
    const edit = saveEntity(createContext(tables, "Editor"), "studio", { ...studioInput("Studio Burst", "studio-burst"), provenance: "confirmed", founded_year: 1999 }, studio.id);
    tables = applyChangeSet(tables, edit.changes);
    const revision = tables.revisions.find((r) => r.entity_id === studio.id && r.action === "update")!;
    // Restoring the version *before* the edit: use a delete-style snapshot via the update's `before`.
    tables.revisions.push({ ...revision, id: "manual", action: "update", after: revision.before });
    tables = applyChangeSet(tables, restoreRevision(createContext(tables, "Editor"), "manual"));
    expect(tables.studios.find((s) => s.id === studio.id)!.founded_year).toBeNull();
  });

  it("applies an accepted correction and keeps the old value in history", () => {
    let tables: ArchiveTables = fresh();
    const p = tables.productions.find((x) => x.slug === "overture")!;
    tables.record_conflicts.push({
      id: "c1",
      entity_type: "production",
      entity_id: p.id,
      field: "premiere_date",
      current_value: null,
      proposed_value: "2019-08-30",
      current_provenance: "confirmed",
      proposed_provenance: "conflicting",
      source_document_id: null,
      status: "open",
      note: null,
      created_at: "2026-10-20T00:00:00.000Z",
      resolved_at: null,
      resolved_by: null,
    });
    tables = applyChangeSet(tables, resolveConflict(createContext(tables, "Editor"), "c1", "accept", "Confirmed by the distributor"));
    expect(tables.productions.find((x) => x.id === p.id)!.premiere_date).toBe("2019-08-30");
    expect(tables.record_conflicts[0].status).toBe("accepted");
    expect(tables.revisions.some((r) => r.action === "resolve" && r.entity_id === p.id && r.before?.premiere_date === null)).toBe(true);
  });

  it("approves a Proposed production together with its own credits", () => {
    let tables = fresh();
    const p = tables.productions.find((x) => x.slug === "stardust-relay")!;
    tables = applyChangeSet(tables, setProvenance(createContext(tables, "Editor"), "production", [p.id], "confirmed", { cascade: true }));
    expect(tables.productions.find((x) => x.id === p.id)!.provenance).toBe("confirmed");
    expect(tables.production_credits.filter((c) => c.production_id === p.id).every((c) => c.provenance === "confirmed")).toBe(true);
    // People keep their own status — approving a production doesn't silently confirm a person.
    expect(tables.people.find((x) => x.slug === "kotaro-hayasaka")!.provenance).toBe("proposed");
  });

  it("creates the next season in the same franchise", () => {
    let tables = fresh();
    const s4 = tables.productions.find((x) => x.slug === "earth-metal-comet-season-4")!;
    const { changes, production } = createNextSeason(createContext(tables, "Editor"), s4.id);
    tables = applyChangeSet(tables, changes);
    expect(production.title).toBe("EARTH: Metal Comet Season 5");
    expect(production.franchise_id).toBe(s4.franchise_id);
    expect(production.season_number).toBe(5);
    expect(production.provenance).toBe("provisional");
    expect(production.premiere_date).toBeNull();
    expect(tables.production_studios.filter((l) => l.production_id === production.id)).toHaveLength(1);
    expect(tables.related_media.some((r) => r.production_id === s4.id && r.related_production_id === production.id && r.relation === "sequel")).toBe(true);
  });
});
