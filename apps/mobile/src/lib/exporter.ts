import * as Clipboard from "expo-clipboard";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Share } from "react-native";
import { briefSectionToMarkdown, fullBriefToMarkdown } from "@/shared/markdown";
import type { BuildBrief, ProjectRow } from "@/shared/types";

export type ExportKind = "markdown" | "text" | "json" | "prompt" | "claude-md" | "agents-md" | "app-html";

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
}

/** Rough Markdown → plain text for people who want a simple document. */
export function markdownToPlainText(md: string): string {
  return md
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^- \[ \] /gm, "☐ ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type ProjectLike = Pick<ProjectRow, "name" | "project_type" | "idea" | "target_user" | "status">;

export function exportContent(kind: Exclude<ExportKind, "app-html">, project: ProjectLike, brief: BuildBrief) {
  const base = slug(project.name);
  const md = fullBriefToMarkdown(project as ProjectRow, brief);
  switch (kind) {
    case "markdown":
      return { filename: `${base}-blueprint.md`, content: md, mime: "text/markdown", uti: "net.daringfireball.markdown" };
    case "text":
      return { filename: `${base}-blueprint.txt`, content: markdownToPlainText(md), mime: "text/plain", uti: "public.plain-text" };
    case "json":
      return {
        filename: `${base}-blueprint.json`,
        content: JSON.stringify({ name: project.name, type: project.project_type, idea: project.idea, targetUser: project.target_user, status: project.status, blueprint: brief }, null, 2),
        mime: "application/json",
        uti: "public.json",
      };
    case "prompt":
      return { filename: `${base}-ai-prompt.txt`, content: brief.claudePrompt, mime: "text/plain", uti: "public.plain-text" };
    case "claude-md":
      return { filename: "CLAUDE.md", content: brief.claudeMd, mime: "text/markdown", uti: "net.daringfireball.markdown" };
    case "agents-md":
      return { filename: "AGENTS.md", content: brief.agentsMd, mime: "text/markdown", uti: "net.daringfireball.markdown" };
  }
}

/** Writes a file to the app's cache and opens the native share sheet. */
export async function shareFile(filename: string, content: string, mime: string, uti?: string): Promise<void> {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  await file.write(content);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: mime, UTI: uti, dialogTitle: filename });
  } else {
    await Share.share({ message: content });
  }
}

export async function copyText(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}

export { briefSectionToMarkdown };
