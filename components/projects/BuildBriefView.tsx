"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Download,
  Loader2,
  Pencil,
  RotateCw,
  Rocket,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DropdownMenu, MenuItem } from "@/components/ui/DropdownMenu";
import { GenerateLoadingOverlay } from "@/components/projects/GenerateLoadingOverlay";
import { usePollForBrief } from "@/lib/usePollForBrief";
import { BriefSection } from "@/components/projects/BriefSection";
import { SectionNav } from "@/components/projects/SectionNav";
import { BuildWithClaudeModal } from "@/components/projects/BuildWithClaudeModal";
import {
  ObjectListEditor,
  StringListEditor,
  BuildPlanEditor,
  TechStackEditor,
} from "@/components/projects/BriefEditors";
import {
  STATUS_LABELS,
  PROJECT_STATUSES,
  type BuildBrief,
  type ProjectRow,
  type ProjectStatus,
  type MvpFeature,
  type LaterFeature,
  type Screen,
  type DatabaseTable,
  type UiComponent,
} from "@/lib/types";
import { cn, slugify } from "@/lib/utils";
import {
  briefSectionToMarkdown,
  fullBriefToMarkdown,
  downloadTextFile,
} from "@/lib/markdown";
import {
  renameProject,
  updateProjectStatus,
  updateProjectBrief,
} from "@/app/(app)/projects/actions";

function cleanStringList(items: string[]): string[] {
  return items.map((s) => s.trim()).filter(Boolean);
}

export function BuildBriefView({
  project,
  initialBrief,
}: {
  project: ProjectRow;
  initialBrief: BuildBrief;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [name, setName] = useState(project.name);
  const [renaming, setRenaming] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>(project.status);

  const [savedBrief, setSavedBrief] = useState<BuildBrief>(initialBrief);
  const [draft, setDraft] = useState<BuildBrief>(initialBrief);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const { start: startPolling, stop: stopPolling } = usePollForBrief();

  useEffect(() => stopPolling, [stopPolling]);
  const [claudeModalOpen, setClaudeModalOpen] = useState(false);
  const [banner, setBanner] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  const brief = editing ? draft : savedBrief;

  function update<K extends keyof BuildBrief>(key: K, value: BuildBrief[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function flash(type: "error" | "success", text: string) {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 4000);
  }

  function copyWithFeedback(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedAction(key);
    setTimeout(() => setCopiedAction(null), 1500);
  }

  function startEditing() {
    setDraft(savedBrief);
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(savedBrief);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    const cleaned: BuildBrief = {
      ...draft,
      userFlow: cleanStringList(draft.userFlow),
      definitionOfDone: cleanStringList(draft.definitionOfDone),
      buildPlan: {
        dayOneMorning: cleanStringList(draft.buildPlan.dayOneMorning),
        dayOneAfternoon: cleanStringList(draft.buildPlan.dayOneAfternoon),
        dayOneEvening: cleanStringList(draft.buildPlan.dayOneEvening),
        dayTwoMorning: cleanStringList(draft.buildPlan.dayTwoMorning),
        dayTwoAfternoon: cleanStringList(draft.buildPlan.dayTwoAfternoon),
        dayTwoFinalPolish: cleanStringList(draft.buildPlan.dayTwoFinalPolish),
      },
    };
    try {
      await updateProjectBrief(project.id, cleaned);
      setSavedBrief(cleaned);
      setDraft(cleaned);
      setEditing(false);
      flash("success", "Changes saved.");
    } catch {
      flash("error", "Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    const since = new Date().toISOString();
    try {
      const res = await fetch(`/api/projects/${project.id}/regenerate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regeneration failed.");

      startPolling(
        { projectId: project.id, since },
        (brief) => {
          setSavedBrief(brief);
          setDraft(brief);
          setEditing(false);
          setRegenerating(false);
          flash("success", "Regenerated a fresh BuildBrief.");
        },
        () => {
          setRegenerating(false);
          flash(
            "error",
            "Regeneration is taking longer than expected. Please try again."
          );
        }
      );
    } catch (err) {
      setRegenerating(false);
      flash("error", err instanceof Error ? err.message : "Regeneration failed.");
    }
  }

  function submitRename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === project.name) {
      setRenaming(false);
      setName(project.name);
      return;
    }
    startTransition(async () => {
      try {
        await renameProject(project.id, trimmed);
        setRenaming(false);
        router.refresh();
      } catch {
        flash("error", "Couldn't rename the project.");
      }
    });
  }

  function handleStatusChange(next: ProjectStatus) {
    setStatus(next);
    startTransition(async () => {
      try {
        await updateProjectStatus(project.id, next);
      } catch {
        flash("error", "Couldn't update status.");
      }
    });
  }

  const filename = slugify(project.name);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8">
      <GenerateLoadingOverlay active={regenerating} />

      <Link
        href="/dashboard"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {renaming ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename();
                  if (e.key === "Escape") {
                    setRenaming(false);
                    setName(project.name);
                  }
                }}
                className="rounded-md border border-accent bg-background-elevated px-2 py-1 text-2xl font-semibold outline-none"
              />
              <button onClick={submitRename} className="text-success" aria-label="Save name">
                <Check className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setRenaming(false);
                  setName(project.name);
                }}
                className="text-muted"
                aria-label="Cancel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setRenaming(true)}
              className="group flex items-center gap-2 text-left"
            >
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
              <Pencil className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {project.project_type}
            </span>
            <DropdownMenu
              align="start"
              trigger={
                <button className="inline-flex items-center gap-1">
                  <StatusBadge status={status} />
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              }
            >
              {(close) => (
                <>
                  {PROJECT_STATUSES.map((s) => (
                    <MenuItem
                      key={s}
                      onClick={() => {
                        handleStatusChange(s);
                        close();
                      }}
                    >
                      <span className="flex w-full items-center justify-between">
                        {STATUS_LABELS[s]}
                        {s === status && <Check className="h-3.5 w-3.5 text-accent" />}
                      </span>
                    </MenuItem>
                  ))}
                </>
              )}
            </DropdownMenu>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button onClick={() => setClaudeModalOpen(true)} size="md">
            <Rocket className="h-4 w-4" />
            Build with Claude
          </Button>

          {editing ? (
            <>
              <Button variant="secondary" onClick={cancelEditing} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={startEditing}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}

          <Button variant="outline" onClick={handleRegenerate} disabled={regenerating || editing}>
            <RotateCw className="h-4 w-4" />
            Regenerate
          </Button>

          <DropdownMenu
            trigger={
              <Button variant="ghost" size="md">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            }
          >
            {(close) => (
              <>
                <MenuItem
                  icon={<Copy className="h-3.5 w-3.5" />}
                  onClick={() => {
                    copyWithFeedback("full", fullBriefToMarkdown(project, brief));
                    close();
                  }}
                >
                  Copy full brief
                </MenuItem>
                <MenuItem
                  icon={<Copy className="h-3.5 w-3.5" />}
                  onClick={() => {
                    copyWithFeedback("prompt", brief.claudePrompt);
                    close();
                  }}
                >
                  Copy Claude prompt
                </MenuItem>
                <div className="my-1 h-px bg-border" />
                <MenuItem
                  icon={<Download className="h-3.5 w-3.5" />}
                  onClick={() => {
                    downloadTextFile(`${filename}-buildbrief.md`, fullBriefToMarkdown(project, brief));
                    close();
                  }}
                >
                  Download Markdown
                </MenuItem>
                <MenuItem
                  icon={<Download className="h-3.5 w-3.5" />}
                  onClick={() => {
                    downloadTextFile("CLAUDE.md", brief.claudeMd);
                    close();
                  }}
                >
                  Download CLAUDE.md
                </MenuItem>
                <MenuItem
                  icon={<Download className="h-3.5 w-3.5" />}
                  onClick={() => {
                    downloadTextFile("AGENTS.md", brief.agentsMd);
                    close();
                  }}
                >
                  Download AGENTS.md
                </MenuItem>
              </>
            )}
          </DropdownMenu>
        </div>
      </div>

      {(banner || copiedAction) && (
        <div
          className={cn(
            "mt-4 rounded-lg border px-4 py-2.5 text-sm",
            banner?.type === "error"
              ? "border-danger/30 bg-danger/10 text-danger"
              : "border-success/30 bg-success/10 text-success"
          )}
        >
          {banner?.text ||
            (copiedAction === "full" ? "Full brief copied to clipboard." : "Claude prompt copied to clipboard.")}
        </div>
      )}

      {/* Body */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_220px]">
        <div className="min-w-0">
          <BriefSection
            id="overview"
            title="Project Overview"
            onCopy={() => copyWithFeedback("overview", briefSectionToMarkdown("overview", brief))}
          >
            {editing ? (
              <Textarea rows={3} value={draft.projectOverview} onChange={(e) => update("projectOverview", e.target.value)} />
            ) : (
              <p className="prose-brief">{brief.projectOverview}</p>
            )}
          </BriefSection>

          <BriefSection
            id="goal"
            title="Product Goal"
            onCopy={() => copyWithFeedback("goal", briefSectionToMarkdown("goal", brief))}
          >
            {editing ? (
              <Textarea rows={3} value={draft.productGoal} onChange={(e) => update("productGoal", e.target.value)} />
            ) : (
              <p className="prose-brief">{brief.productGoal}</p>
            )}
          </BriefSection>

          <BriefSection
            id="target-user"
            title="Target User"
            onCopy={() => copyWithFeedback("target-user", briefSectionToMarkdown("target-user", brief))}
          >
            {editing ? (
              <Textarea rows={2} value={draft.targetUser} onChange={(e) => update("targetUser", e.target.value)} />
            ) : (
              <p className="prose-brief">{brief.targetUser}</p>
            )}
          </BriefSection>

          <BriefSection
            id="mvp-features"
            title="MVP Features"
            onCopy={() => copyWithFeedback("mvp-features", briefSectionToMarkdown("mvp-features", brief))}
          >
            {editing ? (
              <ObjectListEditor<MvpFeature>
                items={draft.mvpFeatures}
                onChange={(items) => update("mvpFeatures", items)}
                addLabel="Add feature"
                emptyItem={() => ({ name: "", description: "", priority: "Medium" })}
                fields={[
                  { key: "name", label: "Name", type: "text" },
                  { key: "priority", label: "Priority", type: "select", options: ["High", "Medium", "Low"] },
                  { key: "description", label: "Description", type: "textarea" },
                ]}
              />
            ) : (
              <div className="space-y-3">
                {brief.mvpFeatures.map((f, i) => (
                  <div key={i} className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">{f.name}</h3>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                          f.priority === "High" && "bg-danger/10 text-danger",
                          f.priority === "Medium" && "bg-warning/10 text-warning",
                          f.priority === "Low" && "bg-muted-foreground/10 text-muted"
                        )}
                      >
                        {f.priority}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted">{f.description}</p>
                  </div>
                ))}
              </div>
            )}
          </BriefSection>

          <BriefSection
            id="later-features"
            title="Later Features"
            onCopy={() => copyWithFeedback("later-features", briefSectionToMarkdown("later-features", brief))}
          >
            {editing ? (
              <ObjectListEditor<LaterFeature>
                items={draft.laterFeatures}
                onChange={(items) => update("laterFeatures", items)}
                addLabel="Add feature"
                emptyItem={() => ({ name: "", description: "" })}
                fields={[
                  { key: "name", label: "Name", type: "text" },
                  { key: "description", label: "Description", type: "textarea" },
                ]}
              />
            ) : (
              <ul className="space-y-2">
                {brief.laterFeatures.map((f, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium text-foreground">{f.name}</span>
                    <span className="text-muted"> — {f.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </BriefSection>

          <BriefSection
            id="screens"
            title="Screens / Pages"
            onCopy={() => copyWithFeedback("screens", briefSectionToMarkdown("screens", brief))}
          >
            {editing ? (
              <ObjectListEditor<Screen>
                items={draft.screens}
                onChange={(items) => update("screens", items)}
                addLabel="Add screen"
                emptyItem={() => ({ name: "", purpose: "", components: [], interactions: [] })}
                fields={[
                  { key: "name", label: "Name", type: "text" },
                  { key: "purpose", label: "Purpose", type: "textarea" },
                  { key: "components", label: "Components", type: "list" },
                  { key: "interactions", label: "Interactions", type: "list" },
                ]}
              />
            ) : (
              <div className="space-y-4">
                {brief.screens.map((s, i) => (
                  <div key={i} className="rounded-lg border border-border bg-surface p-4">
                    <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                    <p className="mt-1 text-sm text-muted">{s.purpose}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.components.map((c) => (
                        <span key={c} className="rounded-full bg-background-elevated px-2.5 py-1 text-xs text-muted">
                          {c}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {s.interactions.join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </BriefSection>

          <BriefSection
            id="user-flow"
            title="User Flow"
            onCopy={() => copyWithFeedback("user-flow", briefSectionToMarkdown("user-flow", brief))}
          >
            {editing ? (
              <StringListEditor items={draft.userFlow} onChange={(items) => update("userFlow", items)} />
            ) : (
              <ol className="space-y-2">
                {brief.userFlow.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface text-[11px] font-medium text-accent">
                      {i + 1}
                    </span>
                    <span className="prose-brief">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </BriefSection>

          <BriefSection
            id="tech-stack"
            title="Recommended Tech Stack"
            onCopy={() => copyWithFeedback("tech-stack", briefSectionToMarkdown("tech-stack", brief))}
          >
            {editing ? (
              <TechStackEditor stack={draft.techStack} onChange={(stack) => update("techStack", stack)} />
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Frontend", brief.techStack.frontend],
                  ["Backend", brief.techStack.backend],
                  ["Database", brief.techStack.database],
                  ["Authentication", brief.techStack.authentication],
                  ["Hosting", brief.techStack.hosting],
                  ...(brief.techStack.aiServices ? [["AI / Services", brief.techStack.aiServices]] : []),
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </BriefSection>

          <BriefSection
            id="database"
            title="Database Plan"
            onCopy={() => copyWithFeedback("database", briefSectionToMarkdown("database", brief))}
          >
            {editing ? (
              <ObjectListEditor<DatabaseTable>
                items={draft.databasePlan}
                onChange={(items) => update("databasePlan", items)}
                addLabel="Add table"
                emptyItem={() => ({ table: "", purpose: "", fields: [] })}
                fields={[
                  { key: "table", label: "Table", type: "text" },
                  { key: "purpose", label: "Purpose", type: "textarea" },
                  { key: "fields", label: "Fields", type: "list" },
                ]}
              />
            ) : brief.databasePlan.length === 0 ? (
              <p className="text-sm text-muted">No database required for the MVP.</p>
            ) : (
              <div className="space-y-4">
                {brief.databasePlan.map((t, i) => (
                  <div key={i} className="rounded-lg border border-border bg-surface p-4">
                    <h3 className="text-sm font-semibold text-foreground">{t.table}</h3>
                    <p className="mt-1 text-sm text-muted">{t.purpose}</p>
                    <ul className="mt-3 space-y-1 font-mono text-xs text-muted-foreground">
                      {t.fields.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </BriefSection>

          <BriefSection
            id="structure"
            title="Project Structure"
            onCopy={() => copyWithFeedback("structure", briefSectionToMarkdown("structure", brief))}
          >
            {editing ? (
              <Textarea
                rows={12}
                className="font-mono text-xs"
                value={draft.projectStructure}
                onChange={(e) => update("projectStructure", e.target.value)}
              />
            ) : (
              <pre className="scrollbar-thin overflow-x-auto rounded-lg border border-border bg-background-elevated p-4 font-mono text-xs leading-relaxed text-muted">
                {brief.projectStructure}
              </pre>
            )}
          </BriefSection>

          <BriefSection
            id="components"
            title="UI Components"
            onCopy={() => copyWithFeedback("components", briefSectionToMarkdown("components", brief))}
          >
            {editing ? (
              <ObjectListEditor<UiComponent>
                items={draft.uiComponents}
                onChange={(items) => update("uiComponents", items)}
                addLabel="Add component"
                emptyItem={() => ({ name: "", description: "" })}
                fields={[
                  { key: "name", label: "Name", type: "text" },
                  { key: "description", label: "Description", type: "textarea" },
                ]}
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {brief.uiComponents.map((c, i) => (
                  <div key={i} className="rounded-lg border border-border bg-surface px-3.5 py-3">
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{c.description}</p>
                  </div>
                ))}
              </div>
            )}
          </BriefSection>

          <BriefSection
            id="build-plan"
            title="48-Hour Build Plan"
            onCopy={() => copyWithFeedback("build-plan", briefSectionToMarkdown("build-plan", brief))}
          >
            {editing ? (
              <BuildPlanEditor plan={draft.buildPlan} onChange={(plan) => update("buildPlan", plan)} />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  ["Day 1 — Morning", brief.buildPlan.dayOneMorning],
                  ["Day 1 — Afternoon", brief.buildPlan.dayOneAfternoon],
                  ["Day 1 — Evening", brief.buildPlan.dayOneEvening],
                  ["Day 2 — Morning", brief.buildPlan.dayTwoMorning],
                  ["Day 2 — Afternoon", brief.buildPlan.dayTwoAfternoon],
                  ["Day 2 — Final Polish", brief.buildPlan.dayTwoFinalPolish],
                ].map(([label, tasks]) => (
                  <div key={label as string}>
                    <h3 className="mb-2 text-sm font-semibold text-foreground">{label}</h3>
                    <ul className="space-y-1.5">
                      {(tasks as string[]).map((task, i) => (
                        <li key={i} className="flex gap-2 text-sm text-muted">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </BriefSection>

          <BriefSection
            id="definition-of-done"
            title="Definition of Done"
            onCopy={() => copyWithFeedback("definition-of-done", briefSectionToMarkdown("definition-of-done", brief))}
          >
            {editing ? (
              <StringListEditor items={draft.definitionOfDone} onChange={(items) => update("definitionOfDone", items)} />
            ) : (
              <ul className="space-y-2">
                {brief.definitionOfDone.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border-strong" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </BriefSection>

          <BriefSection
            id="claude-prompt"
            title="Claude Code Prompt"
            onCopy={() => copyWithFeedback("claude-prompt", brief.claudePrompt)}
          >
            {editing ? (
              <Textarea
                rows={10}
                className="font-mono text-xs"
                value={draft.claudePrompt}
                onChange={(e) => update("claudePrompt", e.target.value)}
              />
            ) : (
              <pre className="scrollbar-thin max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background-elevated p-4 font-mono text-xs leading-relaxed text-muted">
                {brief.claudePrompt}
              </pre>
            )}
          </BriefSection>

          <BriefSection
            id="claude-md"
            title="CLAUDE.md"
            onCopy={() => copyWithFeedback("claude-md", brief.claudeMd)}
          >
            {editing ? (
              <Textarea
                rows={10}
                className="font-mono text-xs"
                value={draft.claudeMd}
                onChange={(e) => update("claudeMd", e.target.value)}
              />
            ) : (
              <pre className="scrollbar-thin max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background-elevated p-4 font-mono text-xs leading-relaxed text-muted">
                {brief.claudeMd}
              </pre>
            )}
          </BriefSection>

          <BriefSection
            id="agents-md"
            title="AGENTS.md"
            onCopy={() => copyWithFeedback("agents-md", brief.agentsMd)}
          >
            {editing ? (
              <Textarea
                rows={10}
                className="font-mono text-xs"
                value={draft.agentsMd}
                onChange={(e) => update("agentsMd", e.target.value)}
              />
            ) : (
              <pre className="scrollbar-thin max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background-elevated p-4 font-mono text-xs leading-relaxed text-muted">
                {brief.agentsMd}
              </pre>
            )}
          </BriefSection>
        </div>

        <div className="hidden lg:block">
          <SectionNav />
        </div>
      </div>

      <BuildWithClaudeModal
        open={claudeModalOpen}
        onClose={() => setClaudeModalOpen(false)}
        prompt={brief.claudePrompt}
      />
    </div>
  );
}
