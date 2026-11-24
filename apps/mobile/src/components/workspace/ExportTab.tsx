import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Share, View } from "react-native";
import { copyText, exportContent, shareFile, type ExportKind } from "@/lib/exporter";
import { feedback } from "@/lib/feedback";
import type { ProjectDetail } from "@/lib/projects";
import { fullBriefToMarkdown } from "@/shared/markdown";
import type { BuildBrief, ProjectRow } from "@/shared/types";
import { useTheme } from "@/theme";
import { AppText } from "../AppText";
import { Card } from "../Card";
import { Banner } from "../Misc";

const FILES: { kind: Exclude<ExportKind, "app-html">; title: string; detail: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { kind: "markdown", title: "Full blueprint (Markdown)", detail: "Great for Notion, GitHub and docs", icon: "document-text-outline" },
  { kind: "text", title: "Full blueprint (plain text)", detail: "Opens anywhere", icon: "reader-outline" },
  { kind: "json", title: "Blueprint data (JSON)", detail: "For tools and automations", icon: "code-slash-outline" },
  { kind: "prompt", title: "AI coding prompt", detail: "Paste into Claude Code or another AI coder", icon: "sparkles-outline" },
  { kind: "claude-md", title: "CLAUDE.md", detail: "Project instructions for Claude Code", icon: "document-outline" },
  { kind: "agents-md", title: "AGENTS.md", detail: "Instructions for AI coding agents", icon: "document-outline" },
];

export function ExportTab({ project, brief }: { project: ProjectDetail; brief: BuildBrief }) {
  const { colors, radius } = useTheme();
  const [message, setMessage] = useState<string | null>(null);

  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2500);
  };

  async function exportFile(kind: Exclude<ExportKind, "app-html">) {
    const { filename, content, mime, uti } = exportContent(kind, project, brief);
    try {
      await shareFile(filename, content, mime, uti);
      feedback.success();
    } catch {
      feedback.error();
      flash("Couldn't create that file. Please try again.");
    }
  }

  const fullMarkdown = fullBriefToMarkdown(project as unknown as ProjectRow, brief);

  return (
    <View style={{ gap: 14 }}>
      {message ? <Banner tone="success" icon="checkmark-circle" text={message} /> : null}
      <Card style={{ gap: 10 }}>
        <AppText variant="subheading">Quick share</AppText>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <QuickButton
            icon="copy-outline"
            label="Copy blueprint"
            onPress={async () => {
              await copyText(fullMarkdown);
              feedback.copy();
              flash("Blueprint copied to your clipboard.");
            }}
          />
          <QuickButton
            icon="share-social-outline"
            label="Share as message"
            onPress={async () => {
              feedback.tap();
              await Share.share({ message: fullMarkdown, title: project.name });
            }}
          />
        </View>
      </Card>
      <Card padded={false} style={{ overflow: "hidden" }}>
        {FILES.map((f, i) => (
          <Pressable
            key={f.kind}
            onPress={() => {
              feedback.tap();
              void exportFile(f.kind);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Export ${f.title}`}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 16,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: colors.border,
              backgroundColor: pressed ? colors.surfaceAlt : "transparent",
            })}
          >
            <View style={{ width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={f.icon} size={19} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{f.title}</AppText>
              <AppText variant="caption">{f.detail}</AppText>
            </View>
            <Ionicons name="share-outline" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </Card>
      <AppText variant="caption" color="faint" align="center">Tip: every section in the Blueprint tab also has its own Copy button.</AppText>
    </View>
  );
}

function QuickButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ flex: 1, alignItems: "center", gap: 6, padding: 14, borderRadius: radius.md, backgroundColor: pressed ? colors.accentSoft : colors.surfaceAlt })}
    >
      <Ionicons name={icon} size={22} color={colors.accent} />
      <AppText variant="caption" style={{ fontWeight: "700", color: colors.text }} align="center">{label}</AppText>
    </Pressable>
  );
}
