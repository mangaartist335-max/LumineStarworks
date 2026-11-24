import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { feedback } from "@/lib/feedback";
import { buildTaskGroups, setTaskProgress } from "@/lib/projects";
import type { BuildBrief } from "@/shared/types";
import { useTheme } from "@/theme";
import { AppText } from "../AppText";
import { Card } from "../Card";
import { Banner } from "../Misc";
import { ProgressBar } from "../ProgressBar";

/** Interactive checklist built from the blueprint; saves automatically. */
export function TasksTab({ projectId, brief, initial }: { projectId: string; brief: BuildBrief; initial: Record<string, boolean> }) {
  const { colors, radius } = useTheme();
  const groups = useMemo(() => buildTaskGroups(brief.buildPlan, brief.definitionOfDone), [brief]);
  const [progress, setProgress] = useState<Record<string, boolean>>(initial);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(progress);

  const total = groups.reduce((n, g) => n + g.tasks.length, 0);
  const completed = groups.reduce((n, g) => n + g.tasks.filter((t) => progress[t.key]).length, 0);

  useEffect(() => () => {
    if (timer.current) {
      clearTimeout(timer.current);
      void setTaskProgress(projectId, latest.current).catch(() => {});
    }
  }, [projectId]);

  function toggle(key: string) {
    const next = { ...progress, [key]: !progress[key] };
    if (!next[key]) delete next[key];
    setProgress(next);
    latest.current = next;

    const nowDone = groups.reduce((n, g) => n + g.tasks.filter((t) => next[t.key]).length, 0);
    if (next[key] && nowDone === total) feedback.fanfare();
    else if (next[key]) feedback.success();
    else feedback.select();

    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      timer.current = null;
      try {
        await setTaskProgress(projectId, latest.current);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 600);
  }

  return (
    <View style={{ gap: 14 }}>
      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <AppText variant="subheading">{completed === total && total > 0 ? "All done! 🎉" : "Your build checklist"}</AppText>
          <AppText variant="caption">{completed}/{total}</AppText>
        </View>
        <ProgressBar value={total ? completed / total : 0} />
        <AppText variant="caption" color="faint">
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved · synced to all your devices" : "Tap a task to check it off. Progress saves automatically."}
        </AppText>
      </Card>
      {saveState === "error" ? <Banner tone="danger" icon="alert-circle" text="Couldn't save your latest change. Check your connection; we'll try again on your next tap." /> : null}
      {groups.map((g) => (
        <Card key={g.id} style={{ gap: 4 }}>
          <AppText variant="subheading" style={{ marginBottom: 6 }}>{g.title}</AppText>
          {g.tasks.map((t) => {
            const done = !!progress[t.key];
            return (
              <Pressable
                key={t.key}
                onPress={() => toggle(t.key)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                accessibilityLabel={t.label}
                style={({ pressed }) => ({ flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 8, paddingHorizontal: 6, borderRadius: radius.sm, backgroundColor: pressed ? colors.surfaceAlt : "transparent" })}
              >
                <Ionicons name={done ? "checkmark-circle" : "ellipse-outline"} size={22} color={done ? colors.success : colors.faint} />
                <AppText style={{ flex: 1, textDecorationLine: done ? "line-through" : "none", color: done ? colors.faint : colors.text }}>{t.label}</AppText>
              </Pressable>
            );
          })}
        </Card>
      ))}
    </View>
  );
}
