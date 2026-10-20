"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requireEditor } from "@/lib/auth";
import { countChanges } from "@/lib/archive/changes";
import { formDataToInput, PARENT_FIELD } from "@/lib/archive/forms";
import { applyImportPlan, ImportFormatError, importHasWork, planImport, type ImportPlan } from "@/lib/archive/import-export";
import { ENTITY_LABEL, PROVENANCE_LABEL } from "@/lib/archive/labels";
import {
  ArchiveError,
  createContext,
  createNextSeason,
  deleteEntity,
  restoreBatch,
  restoreRevision,
  resolveConflict,
  saveEntity,
  setProvenance,
} from "@/lib/archive/mutations";
import { fieldErrors, schemas } from "@/lib/archive/schemas";
import { commitChanges, loadTablesForWrite } from "@/lib/archive/server";
import { ENTITY_TYPES, PROVENANCE_STATUSES, type ChangeSet, type EntityType, type Provenance } from "@/lib/archive/types";

export interface FormState {
  ok?: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
  /** Raw submitted values, echoed back so a failed submission keeps what the editor typed. */
  values?: Record<string, string | string[]>;
  savedAt?: number;
}

function str(formData: FormData, name: string): string | null {
  const v = formData.get(name);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function entityFrom(formData: FormData): EntityType {
  const entity = str(formData, "__entity");
  if (!entity || !(ENTITY_TYPES as readonly string[]).includes(entity)) throw new ArchiveError("Unknown record type.");
  return entity as EntityType;
}

function rawValues(formData: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const all = formData.getAll(key).filter((v): v is string => typeof v === "string");
    out[key] = all.length > 1 ? all : (all[0] ?? "");
  }
  return out;
}

function failure(error: unknown, values?: Record<string, string | string[]>): FormState {
  if (error instanceof ArchiveError) return { error: error.message, errors: error.fieldErrors, values };
  if (error instanceof AuthorizationError || error instanceof ImportFormatError) return { error: error.message, values };
  console.error("[archive] action failed", error);
  return { error: error instanceof Error ? error.message : "Something went wrong while saving.", values };
}

async function commit(changes: ChangeSet) {
  await commitChanges(changes);
  revalidatePath("/", "layout");
}

export async function saveRecordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = rawValues(formData);
  let redirectTo: string | null = null;
  try {
    const viewer = await requireEditor();
    const entity = entityFrom(formData);
    const id = str(formData, "__id");
    const parentField = PARENT_FIELD[entity];
    const fixed: Record<string, string> = {};
    if (parentField && str(formData, parentField)) fixed[parentField] = str(formData, parentField)!;

    const input = formDataToInput(entity, formData, fixed);
    const parsed = schemas[entity].safeParse(input);
    if (!parsed.success) return { error: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error), values };

    const tables = await loadTablesForWrite();
    const ctx = createContext(tables, viewer.name, str(formData, "__source"));
    const result = saveEntity(ctx, entity, parsed.data as never, id);
    if (!result.created && result.changed.length === 0) return { ok: true, message: "No changes to save.", savedAt: Date.now() };
    await commit(result.changes);

    const created = str(formData, "__redirect_created");
    if (result.created && created) redirectTo = created.replace("{id}", result.row.id);
    else
      return {
        ok: true,
        message: result.created ? `${ENTITY_LABEL[entity]} added.` : `Saved ${result.changed.length} change${result.changed.length === 1 ? "" : "s"}.`,
        savedAt: Date.now(),
      };
  } catch (error) {
    return failure(error, values);
  }
  redirect(redirectTo);
}

export async function deleteRecordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  let redirectTo: string | null = null;
  try {
    const viewer = await requireEditor();
    const entity = entityFrom(formData);
    const id = str(formData, "__id");
    if (!id) throw new ArchiveError("Nothing to delete.");
    const tables = await loadTablesForWrite();
    await commit(deleteEntity(createContext(tables, viewer.name), entity, id));
    redirectTo = str(formData, "__redirect");
    if (!redirectTo) return { ok: true, message: `${ENTITY_LABEL[entity]} removed. It can be restored from the revision history.`, savedAt: Date.now() };
  } catch (error) {
    return failure(error);
  }
  redirect(redirectTo);
}

export async function restoreRevisionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const viewer = await requireEditor();
    const tables = await loadTablesForWrite();
    const ctx = createContext(tables, viewer.name);
    const batch = str(formData, "batch_id");
    const revision = str(formData, "revision_id");
    const changes = batch ? restoreBatch(ctx, batch) : restoreRevision(ctx, revision ?? "");
    await commit(changes);
    const restored = changes.upserts.revisions?.length ?? 1;
    return { ok: true, message: restored > 1 ? `Restored ${restored} records.` : "Restored the selected version.", savedAt: Date.now() };
  } catch (error) {
    return failure(error);
  }
}

export async function resolveConflictAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const viewer = await requireEditor();
    const decision = str(formData, "decision");
    if (decision !== "accept" && decision !== "reject") throw new ArchiveError("Choose whether to accept or keep the current value.");
    const tables = await loadTablesForWrite();
    await commit(resolveConflict(createContext(tables, viewer.name), str(formData, "conflict_id") ?? "", decision, str(formData, "note")));
    return { ok: true, message: decision === "accept" ? "Correction accepted. The previous value is kept in the revision history." : "Kept the value on record.", savedAt: Date.now() };
  } catch (error) {
    return failure(error);
  }
}

export async function setProvenanceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const viewer = await requireEditor();
    const entity = entityFrom(formData);
    const provenance = str(formData, "provenance");
    if (!provenance || !(PROVENANCE_STATUSES as readonly string[]).includes(provenance)) throw new ArchiveError("Choose a record status.");
    const ids = formData.getAll("ids").filter((v): v is string => typeof v === "string" && v !== "");
    if (ids.length === 0) throw new ArchiveError("Select at least one record.");
    const tables = await loadTablesForWrite();
    const ctx = createContext(tables, viewer.name, str(formData, "__source"));
    const changes = setProvenance(ctx, entity, ids, provenance as Provenance, { cascade: formData.get("cascade") === "on" });
    await commit(changes);
    const n = countChanges(changes).upserts;
    return { ok: true, message: n ? `Marked ${ids.length} record${ids.length === 1 ? "" : "s"} as ${PROVENANCE_LABEL[provenance as Provenance]}.` : "Those records already had that status.", savedAt: Date.now() };
  } catch (error) {
    return failure(error);
  }
}

export async function createNextSeasonAction(_prev: FormState, formData: FormData): Promise<FormState> {
  let redirectTo: string;
  try {
    const viewer = await requireEditor();
    const tables = await loadTablesForWrite();
    const { changes, production } = createNextSeason(createContext(tables, viewer.name), str(formData, "production_id") ?? "");
    await commit(changes);
    redirectTo = `/admin/productions/${production.id}`;
  } catch (error) {
    return failure(error);
  }
  redirect(redirectTo);
}

export interface ImportState {
  error?: string;
  plan?: ImportPlan;
  applied?: { created: number; updated: number; conflicts: number };
  json?: string;
}

async function readImportJson(formData: FormData): Promise<string> {
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) return await file.text();
  return str(formData, "json") ?? "";
}

export async function importAction(_prev: ImportState, formData: FormData): Promise<ImportState> {
  let json = "";
  try {
    const viewer = await requireEditor();
    json = await readImportJson(formData);
    if (!json) return { error: "Paste a JSON document or choose a file to import." };
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (error) {
      return { error: `That isn't valid JSON: ${(error as Error).message}`, json };
    }
    const tables = await loadTablesForWrite();
    const plan = planImport(tables, parsed);

    if (formData.get("intent") !== "apply") return { plan, json };
    if (!importHasWork(plan)) return { plan, json, error: "There's nothing new to import from this document." };

    const { changes } = applyImportPlan(tables, plan, viewer.name);
    await commit(changes);
    return { plan, json: "", applied: { created: plan.creates.length, updated: plan.updates.length, conflicts: plan.conflicts.length } };
  } catch (error) {
    const state = failure(error);
    return { error: state.error, json };
  }
}
