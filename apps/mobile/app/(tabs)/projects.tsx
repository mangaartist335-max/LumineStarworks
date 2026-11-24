import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppText } from "@/components/AppText";
import { Chip } from "@/components/Chip";
import { Banner, EmptyState } from "@/components/Misc";
import { ProjectCard } from "@/components/ProjectCard";
import { Screen } from "@/components/Screen";
import { ActionSheet, ConfirmSheet } from "@/components/Sheet";
import { CardSkeleton } from "@/components/Skeleton";
import { TextField } from "@/components/TextField";
import type { ProjectSummary } from "@/lib/projects";
import { useProjectActions } from "@/lib/useProjectActions";
import { useProjects } from "@/lib/useProjects";
import { useTheme } from "@/theme";

type Filter = "all" | "blueprints" | "apps" | "completed" | "archived";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "blueprints", label: "Blueprints" },
  { id: "apps", label: "Built apps" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
];

export default function Projects() {
  const { reduceMotion } = useTheme();
  const params = useLocalSearchParams<{ filter?: string; t?: string }>();
  const { projects, offline, refreshing, refresh, error } = useProjects();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const actions = useProjectActions(refresh);

  const filterKey = params.filter === "blueprints" ? `${params.t ?? ""}` : null;
  const [appliedFilterKey, setAppliedFilterKey] = useState<string | null>(null);
  if (filterKey !== null && filterKey !== appliedFilterKey) {
    setAppliedFilterKey(filterKey);
    setFilter("blueprints");
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (projects ?? []).filter((p) => {
      if (filter === "archived" ? !p.archived_at : p.archived_at) return false;
      if (filter === "blueprints" && !p.plan) return false;
      if (filter === "apps" && p.app_status !== "done") return false;
      if (filter === "completed" && p.status !== "completed") return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.overview ?? "").toLowerCase().includes(q) || p.project_type.toLowerCase().includes(q);
    });
  }, [projects, query, filter]);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <AppText variant="title" accessibilityRole="header">Projects</AppText>
      <TextField value={query} onChangeText={setQuery} placeholder="Search projects" returnKeyType="search" accessibilityLabel="Search projects" clearButtonMode="while-editing" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }} style={{ marginHorizontal: -20, paddingLeft: 20 }}>
        {FILTERS.map((f) => (
          <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </ScrollView>

      {offline ? <Banner icon="cloud-offline" text="You're offline. Showing your saved projects." /> : null}
      {actions.message ? <Banner tone={actions.message.tone} icon={actions.message.tone === "success" ? "checkmark-circle" : "alert-circle"} text={actions.message.text} /> : null}

      {projects === null && error ? (
        <EmptyState emoji="📡" title="Couldn't connect" body="Check your internet connection, then try again." actionTitle="Try again" onAction={refresh} />
      ) : projects === null ? (
        <View style={{ gap: 12 }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : visible.length === 0 ? (
        query || filter !== "all" ? (
          <EmptyState emoji="🔎" title="Nothing here yet" body="Try a different search or filter." />
        ) : (
          <EmptyState emoji="🌱" title="No projects yet" body="Tap Create to describe your first idea." actionTitle="Create a project" onAction={() => router.push("/(tabs)/create")} />
        )
      ) : (
        <View style={{ gap: 12 }}>
          <AppText variant="caption">Long-press a project for more options.</AppText>
          {visible.map((p, i) => (
            <Animated.View key={p.id} entering={reduceMotion ? undefined : FadeInDown.delay(Math.min(i, 8) * 40)}>
              <View>
                <ProjectCardWithMenu project={p} onOpen={() => router.push(`/project/${p.id}`)} onMenu={() => actions.setTarget(p)} />
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      <ActionSheet
        visible={!!actions.target && !actions.confirmDelete}
        onClose={() => actions.setTarget(null)}
        title={actions.target?.name}
        actions={
          actions.target
            ? [
                { label: "Open", icon: "open-outline", onPress: () => router.push(`/project/${actions.target!.id}`) },
                { label: "Duplicate", icon: "copy-outline", onPress: () => actions.duplicate(actions.target!.id) },
                { label: actions.target.archived_at ? "Unarchive" : "Archive", icon: "archive-outline", onPress: () => actions.toggleArchive(actions.target!) },
                { label: "Delete", icon: "trash-outline", destructive: true, onPress: () => actions.setConfirmDelete(true) },
              ]
            : []
        }
      />
      <ConfirmSheet
        visible={actions.confirmDelete}
        onClose={() => {
          actions.setConfirmDelete(false);
          actions.setTarget(null);
        }}
        title={`Delete ${actions.target?.name ?? "project"}?`}
        message="This removes the project, its blueprint and its built app on all your devices. It can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (actions.target) await actions.remove(actions.target.id, () => actions.setTarget(null));
        }}
      />
    </Screen>
  );
}

function ProjectCardWithMenu({ project, onOpen, onMenu }: { project: ProjectSummary; onOpen: () => void; onMenu: () => void }) {
  return <ProjectCard project={project} onPress={onOpen} onLongPress={onMenu} />;
}
