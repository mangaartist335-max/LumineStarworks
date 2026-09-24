import type { BuildBrief, ProjectRow } from "./types";

function heading(level: number, text: string): string {
  return `${"#".repeat(level)} ${text}\n`;
}

function list(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function numbered(items: string[]): string {
  return items.map((item, i) => `${i + 1}. ${item}`).join("\n");
}

function sectionMarkdown(sectionId: string, brief: BuildBrief): string {
  switch (sectionId) {
    case "overview":
      return `${heading(2, "Project Overview")}\n${brief.projectOverview}`;
    case "goal":
      return `${heading(2, "Product Goal")}\n${brief.productGoal}`;
    case "target-user":
      return `${heading(2, "Target User")}\n${brief.targetUser}`;
    case "mvp-features":
      return `${heading(2, "MVP Features")}\n${brief.mvpFeatures
        .map((f) => `- **${f.name}** (${f.priority}) — ${f.description}`)
        .join("\n")}`;
    case "later-features":
      return `${heading(2, "Later Features")}\n${brief.laterFeatures
        .map((f) => `- **${f.name}** — ${f.description}`)
        .join("\n")}`;
    case "screens":
      return `${heading(2, "Screens / Pages")}\n${brief.screens
        .map(
          (s) =>
            `### ${s.name}\n${s.purpose}\n\n**Components:** ${s.components.join(", ")}\n\n**Interactions:** ${s.interactions.join(", ")}`
        )
        .join("\n\n")}`;
    case "user-flow":
      return `${heading(2, "User Flow")}\n${numbered(brief.userFlow)}`;
    case "tech-stack":
      return `${heading(2, "Recommended Tech Stack")}\n${list([
        `Frontend: ${brief.techStack.frontend}`,
        `Backend: ${brief.techStack.backend}`,
        `Database: ${brief.techStack.database}`,
        `Authentication: ${brief.techStack.authentication}`,
        `Hosting: ${brief.techStack.hosting}`,
        ...(brief.techStack.aiServices ? [`AI/Services: ${brief.techStack.aiServices}`] : []),
      ])}`;
    case "database":
      return `${heading(2, "Database Plan")}\n${
        brief.databasePlan.length === 0
          ? "No database required for the MVP."
          : brief.databasePlan
              .map(
                (t) =>
                  `### ${t.table}\n${t.purpose}\n\n${list(t.fields.map((f) => `\`${f}\``))}`
              )
              .join("\n\n")
      }`;
    case "structure":
      return `${heading(2, "Project Structure")}\n\`\`\`\n${brief.projectStructure}\n\`\`\``;
    case "components":
      return `${heading(2, "UI Components")}\n${brief.uiComponents
        .map((c) => `- **${c.name}** — ${c.description}`)
        .join("\n")}`;
    case "build-plan": {
      const p = brief.buildPlan;
      return `${heading(2, "48-Hour Build Plan")}\n${heading(3, "Day 1 — Morning")}\n${list(p.dayOneMorning)}\n\n${heading(3, "Day 1 — Afternoon")}\n${list(p.dayOneAfternoon)}\n\n${heading(3, "Day 1 — Evening")}\n${list(p.dayOneEvening)}\n\n${heading(3, "Day 2 — Morning")}\n${list(p.dayTwoMorning)}\n\n${heading(3, "Day 2 — Afternoon")}\n${list(p.dayTwoAfternoon)}\n\n${heading(3, "Day 2 — Final Polish")}\n${list(p.dayTwoFinalPolish)}`;
    }
    case "definition-of-done":
      return `${heading(2, "Definition of Done")}\n${brief.definitionOfDone
        .map((d) => `- [ ] ${d}`)
        .join("\n")}`;
    case "claude-prompt":
      return `${heading(2, "Claude Code Prompt")}\n\`\`\`\n${brief.claudePrompt}\n\`\`\``;
    case "claude-md":
      return `${heading(2, "CLAUDE.md")}\n\`\`\`markdown\n${brief.claudeMd}\n\`\`\``;
    case "agents-md":
      return `${heading(2, "AGENTS.md")}\n\`\`\`markdown\n${brief.agentsMd}\n\`\`\``;
    default:
      return "";
  }
}

export function briefSectionToMarkdown(sectionId: string, brief: BuildBrief): string {
  return sectionMarkdown(sectionId, brief).trim();
}

export function fullBriefToMarkdown(project: ProjectRow, brief: BuildBrief): string {
  const sectionIds = [
    "overview",
    "goal",
    "target-user",
    "mvp-features",
    "later-features",
    "screens",
    "user-flow",
    "tech-stack",
    "database",
    "structure",
    "components",
    "build-plan",
    "definition-of-done",
    "claude-prompt",
    "claude-md",
    "agents-md",
  ];

  const header = `${heading(1, project.name)}\n*${project.project_type} — BuildBrief*\n`;
  const body = sectionIds.map((id) => sectionMarkdown(id, brief)).join("\n\n");

  return `${header}\n${body}\n`;
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
