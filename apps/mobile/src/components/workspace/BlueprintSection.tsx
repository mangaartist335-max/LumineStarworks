import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { briefSectionToMarkdown } from "@/shared/markdown";
import type { BuildBrief } from "@/shared/types";
import { useTheme } from "@/theme";
import { AppText } from "../AppText";
import { Bullets, CodeBlock, SectionCard } from "../SectionCard";
import { Pill } from "../StatusPill";

export type SectionId =
  | "overview"
  | "goal"
  | "target-user"
  | "mvp-features"
  | "later-features"
  | "screens"
  | "user-flow"
  | "tech-stack"
  | "architecture"
  | "database"
  | "api"
  | "structure"
  | "components"
  | "build-plan"
  | "definition-of-done"
  | "testing"
  | "deployment"
  | "claude-prompt"
  | "claude-md"
  | "agents-md";

export const SECTION_META: Record<SectionId, { title: string; icon: keyof typeof Ionicons.glyphMap }> = {
  overview: { title: "What it is", icon: "bulb-outline" },
  goal: { title: "The goal", icon: "flag-outline" },
  "target-user": { title: "Who it's for", icon: "people-outline" },
  "mvp-features": { title: "Main features", icon: "star-outline" },
  "later-features": { title: "Ideas for later", icon: "time-outline" },
  screens: { title: "Screens", icon: "phone-portrait-outline" },
  "user-flow": { title: "How people use it", icon: "git-commit-outline" },
  "tech-stack": { title: "Technology", icon: "layers-outline" },
  architecture: { title: "Architecture", icon: "git-network-outline" },
  database: { title: "Database", icon: "server-outline" },
  api: { title: "API requirements", icon: "swap-horizontal-outline" },
  structure: { title: "Folder structure", icon: "folder-open-outline" },
  components: { title: "UI building blocks", icon: "cube-outline" },
  "build-plan": { title: "48-hour build plan", icon: "calendar-outline" },
  "definition-of-done": { title: "What “finished” looks like", icon: "checkmark-done-outline" },
  testing: { title: "Testing plan", icon: "flask-outline" },
  deployment: { title: "Launch & deployment", icon: "rocket-outline" },
  "claude-prompt": { title: "AI coding prompt", icon: "sparkles-outline" },
  "claude-md": { title: "CLAUDE.md", icon: "document-text-outline" },
  "agents-md": { title: "AGENTS.md", icon: "document-text-outline" },
};

/** True when the blueprint has content for this section (newer sections are optional). */
export function hasSection(id: SectionId, brief: BuildBrief): boolean {
  switch (id) {
    case "architecture":
      return !!brief.architecture;
    case "api":
      return !!brief.apiRequirements?.length;
    case "testing":
      return !!brief.testingPlan?.length;
    case "deployment":
      return !!brief.deploymentPlan;
    default:
      return true;
  }
}

const PRIORITY_TONE = { High: "danger", Medium: "warning", Low: "neutral" } as const;

function Body({ id, brief }: { id: SectionId; brief: BuildBrief }) {
  const { colors, radius } = useTheme();
  const sub = (title: string, children: React.ReactNode, key?: string | number) => (
    <View key={key} style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 12, gap: 6 }}>
      <AppText variant="bodyStrong">{title}</AppText>
      {children}
    </View>
  );

  switch (id) {
    case "overview":
      return <AppText color="muted">{brief.projectOverview}</AppText>;
    case "goal":
      return <AppText color="muted">{brief.productGoal}</AppText>;
    case "target-user":
      return <AppText color="muted">{brief.targetUser}</AppText>;
    case "mvp-features":
      return (
        <View style={{ gap: 10 }}>
          {brief.mvpFeatures.map((f, i) =>
            sub(
              f.name,
              <>
                <Pill label={f.priority} tone={PRIORITY_TONE[f.priority]} />
                <AppText variant="caption">{f.description}</AppText>
              </>,
              i
            )
          )}
        </View>
      );
    case "later-features":
      return <View style={{ gap: 10 }}>{brief.laterFeatures.map((f, i) => sub(f.name, <AppText variant="caption">{f.description}</AppText>, i))}</View>;
    case "screens":
      return (
        <View style={{ gap: 10 }}>
          {brief.screens.map((s, i) =>
            sub(
              s.name,
              <>
                <AppText variant="caption">{s.purpose}</AppText>
                {s.interactions.length ? <AppText variant="caption" color="faint">You can: {s.interactions.join(" · ")}</AppText> : null}
              </>,
              i
            )
          )}
        </View>
      );
    case "user-flow":
      return <Bullets items={brief.userFlow} numbered />;
    case "tech-stack": {
      const t = brief.techStack;
      const rows = [
        ["Frontend", t.frontend],
        ["Backend", t.backend],
        ["Database", t.database],
        ["Sign-in", t.authentication],
        ["Hosting", t.hosting],
        ...(t.aiServices ? [["AI", t.aiServices]] : []),
      ];
      return (
        <View style={{ gap: 8 }}>
          {rows.map(([k, v]) => (
            <View key={k} style={{ flexDirection: "row", gap: 10 }}>
              <AppText variant="caption" style={{ width: 80, fontWeight: "700" }}>{k}</AppText>
              <AppText variant="caption" style={{ flex: 1 }} color="text">{v}</AppText>
            </View>
          ))}
        </View>
      );
    }
    case "architecture":
      return <AppText color="muted">{brief.architecture}</AppText>;
    case "database":
      return brief.databasePlan.length === 0 ? (
        <AppText color="muted">No database needed for the first version.</AppText>
      ) : (
        <View style={{ gap: 10 }}>
          {brief.databasePlan.map((t, i) =>
            sub(
              t.table,
              <>
                <AppText variant="caption">{t.purpose}</AppText>
                <CodeBlock text={t.fields.join("\n")} />
              </>,
              i
            )
          )}
        </View>
      );
    case "api":
      return <Bullets items={brief.apiRequirements ?? []} />;
    case "structure":
      return <CodeBlock text={brief.projectStructure} />;
    case "components":
      return <View style={{ gap: 10 }}>{brief.uiComponents.map((c, i) => sub(c.name, <AppText variant="caption">{c.description}</AppText>, i))}</View>;
    case "build-plan": {
      const p = brief.buildPlan;
      const groups: [string, string[]][] = [
        ["Day 1 · Morning", p.dayOneMorning],
        ["Day 1 · Afternoon", p.dayOneAfternoon],
        ["Day 1 · Evening", p.dayOneEvening],
        ["Day 2 · Morning", p.dayTwoMorning],
        ["Day 2 · Afternoon", p.dayTwoAfternoon],
        ["Day 2 · Final polish", p.dayTwoFinalPolish],
      ];
      return <View style={{ gap: 10 }}>{groups.map(([title, items]) => sub(title, <Bullets items={items} />, title))}</View>;
    }
    case "definition-of-done":
      return <Bullets items={brief.definitionOfDone} />;
    case "testing":
      return <Bullets items={brief.testingPlan ?? []} />;
    case "deployment":
      return <AppText color="muted">{brief.deploymentPlan}</AppText>;
    case "claude-prompt":
      return <CodeBlock text={brief.claudePrompt} />;
    case "claude-md":
      return <CodeBlock text={brief.claudeMd} />;
    case "agents-md":
      return <CodeBlock text={brief.agentsMd} />;
  }
}

export function BlueprintSection({ id, brief, collapsible, defaultOpen = true }: { id: SectionId; brief: BuildBrief; collapsible?: boolean; defaultOpen?: boolean }) {
  if (!hasSection(id, brief)) return null;
  const meta = SECTION_META[id];
  return (
    <SectionCard title={meta.title} icon={meta.icon} copyText={briefSectionToMarkdown(id, brief)} collapsible={collapsible} defaultOpen={defaultOpen}>
      <Body id={id} brief={brief} />
    </SectionCard>
  );
}
