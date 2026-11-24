import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { Banner } from "@/components/Misc";
import { ProgressBar } from "@/components/ProgressBar";
import { Screen } from "@/components/Screen";
import { ActionSheet, ConfirmSheet, PromptSheet } from "@/components/Sheet";
import { CardSkeleton } from "@/components/Skeleton";
import { Pill } from "@/components/StatusPill";
import { BlueprintSection, type SectionId } from "@/components/workspace/BlueprintSection";
import { BuildTab } from "@/components/workspace/BuildTab";
import { ExportTab } from "@/components/workspace/ExportTab";
import { JobProgress } from "@/components/workspace/JobProgress";
import { TasksTab } from "@/components/workspace/TasksTab";
import { feedback } from "@/lib/feedback";
import {
  getCachedProject,
  getProject,
  regenerateBlueprint,
  renameProject,
  saveBrief,
  setProjectStatus,
  taskProgress,
  type ProjectDetail,
} from "@/lib/projects";
import { categoryFor } from "@/lib/templates";
import { useJobPoll } from "@/lib/useJobPoll";
import { useProjectActions } from "@/lib/useProjectActions";
import { PROJECT_STATUSES, STATUS_LABELS, type BuildBrief } from "@/shared/types";
import { useTheme } from "@/theme";

type Tab = "overview" | "features" | "blueprint" | "tasks" | "architecture" | "dev" | "build" | "export";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "build", label: "Build App" },
  { id: "features", label: "Features" },
  { id: "tasks", label: "Tasks" },
  { id: "blueprint", label: "Blueprint" },
  { id: "architecture", label: "Architecture" },
  { id: "dev", label: "Dev" },
  { id: "export", label: "Export" },
];

const ALL_SECTIONS: SectionId[] = [
  "overview", "goal", "target-user", "mvp-features", "later-features", "screens", "user-flow",
  "tech-stack", "architecture", "database", "api", "structure", "components",
  "build-plan", "definition-of-done", "testing", "deployment", "claude-prompt", "claude-md", "agents-md",
];

const PLAN_STEPS = [
  "Reading your idea…",
  "Picking the main features…",
  "Sketching the screens…",
  "Thinking about who'll use it…",
  "Choosing the technology…",
  "Writing your build plan…",
  "Preparing your AI coding files…",
  "Almost ready…",
];

type EditField = "projectOverview" | "productGoal" | "targetUser";
const EDIT_LABELS: Record<EditField, string> = { projectOverview: "What it is", productGoal: "The goal", targetUser: "Who it's for" };

export default function Workspace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, reduceMotion } = useTheme();
  const [project, setProject] = useState<ProjectDetail | null | undefined>(undefined);
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [editing, setEditing] = useState<EditField | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regenConfirm, setRegenConfirm] = useState(false);
  const poll = useJobPoll(id, "blueprint");

  const load = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      try {
        const result = await getProject(id);
        setProject(result.project);
        setOffline(result.offline);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't load this project.");
      } finally {
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    getCachedProject(id).then((cached) => {
      if (cached) setProject((p) => p ?? cached);
    });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const actions = useProjectActions(() => void load());

  // Follow a blueprint that's still being generated.
  useEffect(() => {
    if (project?.generation_status === "generating" && poll.phase === "idle") {
      poll.start({
        onDone: () => {
          feedback.complete();
          void load();
        },
        onFailed: () => {
          feedback.error();
          void load();
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.generation_status]);

  async function regenerate() {
    setError(null);
    feedback.start();
    try {
      await regenerateBlueprint(id);
      setProject((p) => (p ? { ...p, generation_status: "generating", generation_error: null } : p));
      poll.start({
        onDone: () => {
          feedback.complete();
          void load();
        },
        onFailed: () => {
          feedback.error();
          void load();
        },
      });
    } catch (e) {
      feedback.error();
      setError(e instanceof Error ? e.message : "Couldn't start generation.");
    }
  }

  if (project === undefined) {
    return (
      <Screen>
        <BackBar title="" />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </Screen>
    );
  }
  if (project === null) {
    return (
      <Screen>
        <BackBar title="" />
        <Banner tone="danger" icon="alert-circle" text="This project couldn't be found. It may have been deleted on another device." />
        <Button title="Back to projects" onPress={() => router.replace("/(tabs)/projects")} />
      </Screen>
    );
  }

  const brief = project.generated_brief as BuildBrief | null;
  const generating = project.generation_status === "generating" || poll.phase === "running";
  const cat = categoryFor(project.project_type);
  const progress = taskProgress(brief?.buildPlan, brief?.definitionOfDone, project.task_progress);

  async function saveField(field: EditField, value: string) {
    if (!brief || !project) return;
    const next = { ...brief, [field]: value };
    try {
      await saveBrief(project.id, next);
      setProject({ ...project, generated_brief: next });
      feedback.success();
    } catch (e) {
      feedback.error();
      setError(e instanceof Error ? e.message : "Couldn't save.");
    }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={() => load(true)}>
      <BackBar title={cat.label} onMenu={() => setMenuOpen(true)} />

      <Pressable onPress={() => setRenaming(true)} accessibilityRole="button" accessibilityHint="Rename project" style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <AppText style={{ fontSize: 30 }}>{cat.emoji}</AppText>
          <AppText variant="title" style={{ flex: 1 }} numberOfLines={2}>{project.name}</AppText>
          <Ionicons name="pencil" size={16} color={colors.faint} />
        </View>
      </Pressable>

      {offline ? <Banner icon="cloud-offline" text="You're offline. This is your saved copy; changes need a connection." /> : null}
      {error ? <Banner tone="danger" icon="alert-circle" text={error} /> : null}
      {actions.message ? <Banner tone={actions.message.tone} icon="information-circle" text={actions.message.text} /> : null}
      {project.archived_at ? <Banner icon="archive" text="This project is archived. Use the ⋯ menu to bring it back." /> : null}

      {generating ? (
        <JobProgress title="Planning your app" steps={PLAN_STEPS} startedAt={poll.startedAt ?? (project.generation_started_at ? new Date(project.generation_started_at).getTime() : null)} typicalSeconds={75} />
      ) : !brief ? (
        <Card style={{ gap: 12 }}>
          <AppText variant="heading">{project.generation_status === "failed" ? "Your blueprint didn't finish" : "Let's plan this idea"}</AppText>
          {project.generation_error ? <Banner tone="danger" icon="alert-circle" text={project.generation_error} /> : null}
          <AppText color="muted">{project.idea}</AppText>
          <Button title={project.generation_status === "failed" ? "Try again" : "Generate Blueprint"} icon="sparkles" size="lg" fullWidth onPress={regenerate} withFeedback={false} />
        </Card>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }} style={{ marginHorizontal: -20, paddingLeft: 20 }} accessibilityRole="tablist">
            {TABS.map((t) => (
              <Chip key={t.id} label={t.label} selected={tab === t.id} onPress={() => setTab(t.id)} />
            ))}
          </ScrollView>

          <Animated.View key={tab} entering={reduceMotion ? undefined : FadeIn.duration(180)} style={{ gap: 14 }}>
            {tab === "overview" ? (
              <>
                <Card style={{ gap: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <AppText variant="subheading">Progress</AppText>
                    <AppText variant="caption">{progress.completed}/{progress.total} tasks</AppText>
                  </View>
                  <ProgressBar value={progress.ratio} />
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {PROJECT_STATUSES.map((s) => (
                      <Chip
                        key={s}
                        label={STATUS_LABELS[s]}
                        selected={project.status === s}
                        onPress={async () => {
                          setProject({ ...project, status: s });
                          try {
                            await setProjectStatus(project.id, s);
                            if (s === "completed") feedback.fanfare();
                          } catch {
                            feedback.error();
                          }
                        }}
                      />
                    ))}
                  </View>
                  {project.app_status === "done" ? <Pill label="App ready to play" tone="success" /> : null}
                </Card>
                <Button title={project.app_status === "done" ? "Open my app" : "Build my app"} icon={project.app_status === "done" ? "play" : "hammer"} size="lg" fullWidth onPress={() => (project.app_status === "done" ? router.push(`/project/${project.id}/preview`) : setTab("build"))} />
                {(["projectOverview", "productGoal", "targetUser"] as EditField[]).map((field) => (
                  <Card key={field} style={{ gap: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <AppText variant="subheading" style={{ flex: 1 }}>{EDIT_LABELS[field]}</AppText>
                      <Pressable onPress={() => setEditing(field)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Edit ${EDIT_LABELS[field]}`}>
                        <Ionicons name="create-outline" size={18} color={colors.accent} />
                      </Pressable>
                    </View>
                    <AppText color="muted">{brief[field]}</AppText>
                  </Card>
                ))}
              </>
            ) : null}

            {tab === "features" ? (["mvp-features", "later-features", "screens", "user-flow"] as SectionId[]).map((s) => <BlueprintSection key={s} id={s} brief={brief} />) : null}

            {tab === "blueprint" ? (
              <>
                <AppText variant="caption">Your complete blueprint. Tap a section to expand it, or copy any part.</AppText>
                {ALL_SECTIONS.map((s, i) => (
                  <BlueprintSection key={s} id={s} brief={brief} collapsible defaultOpen={i < 3} />
                ))}
              </>
            ) : null}

            {tab === "tasks" ? <TasksTab projectId={project.id} brief={brief} initial={project.task_progress ?? {}} /> : null}

            {tab === "architecture" ? (["tech-stack", "architecture", "database", "api", "structure", "components"] as SectionId[]).map((s) => <BlueprintSection key={s} id={s} brief={brief} collapsible />) : null}

            {tab === "dev" ? (
              <>
                <Card style={{ gap: 6, backgroundColor: colors.accentSoft, borderColor: colors.accent + "44" }}>
                  <AppText variant="subheading">Building it with code?</AppText>
                  <AppText variant="caption">
                    Paste the AI coding prompt into Claude Code (or another AI coder), and drop CLAUDE.md and AGENTS.md into your project folder. Follow the 48-hour plan and test with the testing plan.
                  </AppText>
                </Card>
                {(["claude-prompt", "claude-md", "agents-md", "build-plan", "testing", "deployment"] as SectionId[]).map((s) => (
                  <BlueprintSection key={s} id={s} brief={brief} collapsible defaultOpen={s === "claude-prompt"} />
                ))}
              </>
            ) : null}

            {tab === "build" ? <BuildTab project={project} onChanged={() => void load()} /> : null}
            {tab === "export" ? <ExportTab project={project} brief={brief} /> : null}
          </Animated.View>
        </>
      )}

      <ActionSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={project.name}
        actions={[
          { label: "Rename", icon: "pencil-outline", onPress: () => setRenaming(true) },
          ...(brief ? [{ label: "Regenerate blueprint", icon: "refresh-outline" as const, onPress: () => setRegenConfirm(true) }] : []),
          { label: "Duplicate", icon: "copy-outline", onPress: () => actions.duplicate(project.id) },
          { label: project.archived_at ? "Unarchive" : "Archive", icon: "archive-outline", onPress: () => actions.toggleArchive({ id: project.id, archived_at: project.archived_at ?? null }) },
          { label: "Delete", icon: "trash-outline", destructive: true, onPress: () => actions.setConfirmDelete(true) },
        ]}
      />
      <PromptSheet
        visible={renaming}
        onClose={() => setRenaming(false)}
        title="Rename project"
        initialValue={project.name}
        onSubmit={async (name) => {
          try {
            await renameProject(project.id, name);
            setProject({ ...project, name });
            feedback.success();
          } catch (e) {
            feedback.error();
            setError(e instanceof Error ? e.message : "Couldn't rename.");
          }
        }}
      />
      <PromptSheet
        visible={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit “${EDIT_LABELS[editing]}”` : ""}
        initialValue={editing && brief ? brief[editing] : ""}
        multiline
        onSubmit={async (value) => {
          if (editing) await saveField(editing, value);
        }}
      />
      <ConfirmSheet
        visible={regenConfirm}
        onClose={() => setRegenConfirm(false)}
        title="Regenerate the blueprint?"
        message="BuildBrief will write a fresh blueprint from your original idea. This replaces the current one (your built app stays) and uses one of today's generations."
        confirmLabel="Regenerate"
        onConfirm={async () => {
          setRegenConfirm(false);
          await regenerate();
        }}
      />
      <ConfirmSheet
        visible={actions.confirmDelete}
        onClose={() => actions.setConfirmDelete(false)}
        title={`Delete ${project.name}?`}
        message="This removes the project, its blueprint and its built app on all your devices. It can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => actions.remove(project.id, () => router.replace("/(tabs)/projects"))}
      />
    </Screen>
  );
}

function BackBar({ title, onMenu }: { title: string; onMenu?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
      >
        <Ionicons name="chevron-back" size={24} color={colors.accent} />
        <AppText variant="bodyStrong" style={{ color: colors.accent }}>Back</AppText>
      </Pressable>
      {title ? <AppText variant="caption">{title}</AppText> : null}
      {onMenu ? (
        <Pressable onPress={() => { feedback.tap(); onMenu(); }} hitSlop={12} accessibilityRole="button" accessibilityLabel="Project options">
          <Ionicons name="ellipsis-horizontal-circle" size={28} color={colors.accent} />
        </Pressable>
      ) : (
        <View style={{ width: 28 }} />
      )}
    </View>
  );
}
