import { View } from "react-native";
import { categoryFor } from "@/lib/templates";
import { taskProgress, type ProjectSummary } from "@/lib/projects";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";
import { PressableScale } from "./PressableScale";
import { ProgressBar } from "./ProgressBar";
import { Pill, StatusPill } from "./StatusPill";
import { feedback } from "@/lib/feedback";

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

export function ProjectCard({
  project,
  onPress,
  onLongPress,
  compact,
}: {
  project: ProjectSummary;
  onPress: () => void;
  onLongPress?: () => void;
  compact?: boolean;
}) {
  const { colors, radius } = useTheme();
  const cat = categoryFor(project.project_type);
  const progress = taskProgress(project.plan, project.done, project.task_progress);

  const jobPill =
    project.generation_status === "generating" ? (
      <Pill label="Planning…" tone="accent" />
    ) : project.app_status === "building" ? (
      <Pill label="Building app…" tone="warning" />
    ) : project.app_status === "done" ? (
      <Pill label="App ready" tone="success" />
    ) : project.generation_status === "failed" ? (
      <Pill label="Needs attention" tone="danger" />
    ) : null;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${project.name}, ${cat.label}`}
      onPress={() => {
        feedback.tap();
        onPress();
      }}
      onLongPress={
        onLongPress
          ? () => {
              feedback.select();
              onLongPress();
            }
          : undefined
      }
      delayLongPress={350}
      accessibilityHint={onLongPress ? "Long-press for more options" : undefined}
      accessibilityActions={onLongPress ? [{ name: "longpress", label: "More options" }] : undefined}
      onAccessibilityAction={onLongPress ? () => onLongPress() : undefined}
      pressedScale={0.98}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        gap: 10,
        width: compact ? 250 : undefined,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" }}>
          <AppText style={{ fontSize: 22 }}>{cat.emoji}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="subheading" numberOfLines={1}>
            {project.name}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            {cat.label} · {timeAgo(project.updated_at)}
          </AppText>
        </View>
      </View>
      {!compact && project.overview ? (
        <AppText variant="caption" numberOfLines={2}>
          {project.overview}
        </AppText>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <StatusPill status={project.status} />
        {jobPill}
        {project.archived_at ? <Pill label="Archived" /> : null}
      </View>
      {progress.total > 0 ? (
        <View style={{ gap: 6 }}>
          <ProgressBar value={progress.ratio} height={6} />
          <AppText variant="caption" color="faint">
            {progress.completed} of {progress.total} tasks done
          </AppText>
        </View>
      ) : null}
    </PressableScale>
  );
}
