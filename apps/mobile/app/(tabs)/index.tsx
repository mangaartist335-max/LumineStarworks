import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppText } from "@/components/AppText";
import { LogoMark } from "@/components/Brand";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Banner, EmptyState, SectionHeader } from "@/components/Misc";
import { PressableScale } from "@/components/PressableScale";
import { ProgressBar } from "@/components/ProgressBar";
import { ProjectCard } from "@/components/ProjectCard";
import { Screen } from "@/components/Screen";
import { CardSkeleton } from "@/components/Skeleton";
import { TextField } from "@/components/TextField";
import { TemplateTile } from "@/components/TemplateTile";
import { useAuth } from "@/lib/auth";
import { feedback } from "@/lib/feedback";
import { getProfile, taskProgress } from "@/lib/projects";
import { TEMPLATES } from "@/lib/templates";
import { useProjects } from "@/lib/useProjects";
import { useTheme } from "@/theme";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Home() {
  const { colors, reduceMotion } = useTheme();
  const { session } = useAuth();
  const { projects, offline, refreshing, refresh, error } = useProjects();
  const [name, setName] = useState<string | null>(null);
  const [idea, setIdea] = useState("");

  useFocusEffect(
    useCallback(() => {
      getProfile().then((p) => setName(p?.display_name ?? null)).catch(() => {});
    }, [])
  );

  const firstName = (name || session?.user.email?.split("@")[0] || "").split(" ")[0];
  const active = (projects ?? []).filter((p) => !p.archived_at);
  const continueBuilding = active.filter((p) => p.generation_status === "done" && p.status !== "completed").slice(0, 6);
  const recent = active.slice(0, 3);
  const withPlan = active.filter((p) => p.plan);
  const totals = withPlan.reduce(
    (acc, p) => {
      const t = taskProgress(p.plan, p.done, p.task_progress);
      return { done: acc.done + t.completed, total: acc.total + t.total };
    },
    { done: 0, total: 0 }
  );
  const enter = (i: number) => (reduceMotion ? undefined : FadeInDown.delay(i * 70).springify());

  function startFromIdea() {
    feedback.start();
    router.push({ pathname: "/(tabs)/create", params: { idea: idea.trim(), t: String(Date.now()) } });
    setIdea("");
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh} bottomInset={32}>
      <Animated.View entering={enter(0)} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <LogoMark size={40} />
        <View style={{ flex: 1 }}>
          <AppText variant="caption">{greeting()}{firstName ? "," : ""}</AppText>
          <AppText variant="heading" numberOfLines={1}>{firstName ? `${firstName} 👋` : "Welcome 👋"}</AppText>
        </View>
      </Animated.View>

      {offline ? <Banner icon="cloud-offline" text="You're offline. Showing your saved projects." /> : null}

      <Animated.View entering={enter(1)}>
        <Card style={{ gap: 12 }}>
          <AppText variant="heading">What do you want to make today?</AppText>
          <TextField
            value={idea}
            onChangeText={setIdea}
            placeholder="A game where you pop bubbles for points…"
            multiline
            style={{ minHeight: 84 }}
            accessibilityLabel="Quick idea"
          />
          <Button title="Create project" icon="sparkles" size="lg" fullWidth onPress={startFromIdea} withFeedback={false} />
        </Card>
      </Animated.View>

      {totals.total > 0 ? (
        <Animated.View entering={enter(2)}>
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <AppText variant="subheading">Your progress</AppText>
              <AppText variant="caption">{totals.done}/{totals.total} tasks</AppText>
            </View>
            <ProgressBar value={totals.total ? totals.done / totals.total : 0} />
            <AppText variant="caption">
              {withPlan.length} saved blueprint{withPlan.length === 1 ? "" : "s"} · keep going, you’re doing great ✨
            </AppText>
          </Card>
        </Animated.View>
      ) : null}

      {projects === null && error ? (
        <EmptyState emoji="📡" title="Couldn't connect" body="Check your internet connection, then try again." actionTitle="Try again" onAction={refresh} />
      ) : projects === null ? (
        <View style={{ gap: 12 }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : active.length === 0 ? (
        <EmptyState
          emoji="🌱"
          title="Your first project starts here"
          body="Describe an idea above, or pick a template below to get going in seconds."
        />
      ) : (
        <>
          {continueBuilding.length > 0 ? (
            <>
              <SectionHeader title="Continue building" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }} style={{ marginHorizontal: -20, paddingLeft: 20 }}>
                {continueBuilding.map((p) => (
                  <ProjectCard key={p.id} project={p} compact onPress={() => router.push(`/project/${p.id}`)} />
                ))}
              </ScrollView>
            </>
          ) : null}

          <SectionHeader title="Recent projects" action="See all" onAction={() => router.push("/(tabs)/projects")} />
          <View style={{ gap: 12 }}>
            {recent.map((p) => (
              <ProjectCard key={p.id} project={p} onPress={() => router.push(`/project/${p.id}`)} />
            ))}
          </View>
        </>
      )}

      <SectionHeader title="Start from a template" action="Browse" onAction={() => router.push("/(tabs)/templates")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }} style={{ marginHorizontal: -20, paddingLeft: 20 }}>
        {TEMPLATES.slice(0, 6).map((t) => (
          <TemplateTile key={t.id} template={t} width={170} />
        ))}
      </ScrollView>

      {withPlan.length > 0 ? (
        <PressableScale
          onPress={() => {
            feedback.tap();
            router.push({ pathname: "/(tabs)/projects", params: { filter: "blueprints", t: String(Date.now()) } });
          }}
          accessibilityRole="button"
          style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20, backgroundColor: colors.accentSoft }}
        >
          <Ionicons name="document-text" size={22} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">Saved blueprints</AppText>
            <AppText variant="caption">{withPlan.length} ready to open, share or export</AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.accent} />
        </PressableScale>
      ) : null}
    </Screen>
  );
}
