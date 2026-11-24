import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  BriefGenerationError,
  MAX_TOKENS,
  MODEL,
  anthropicErrorMessage,
  client,
  isRetryable,
  sleep,
} from "@/lib/anthropic";
import type { BuildBrief, ProjectType } from "@/lib/types";

export interface BuildAppParams {
  name: string;
  projectType: ProjectType;
  idea: string;
  brief: BuildBrief;
}

const SYSTEM_PROMPT = `You are an expert front-end engineer and game developer. You turn a product blueprint into a polished, working, single-file web app that someone can play with immediately.

Hard requirements (the app runs inside a locked-down sandboxed iframe, so these are not optional):
- Output ONE complete HTML document and nothing else: start with <!DOCTYPE html> and end with </html>. No markdown, no code fences, no explanations before or after.
- Everything inline: all CSS in <style>, all JavaScript in <script>. Plain modern JavaScript, no build step, no frameworks.
- No external resources at all: no CDN scripts, no web fonts, no remote images, no fetch/XHR/WebSocket calls. Use system fonts, CSS, inline SVG and emoji for visuals.
- Storage may be blocked. Keep state in memory, and if you persist with localStorage, wrap every access in try/catch so the app still works without it.
- No login screens and no real backend. Seed the app with realistic, specific sample data so it feels alive on first load, and make adding, editing and deleting work in memory.

Quality bar:
- Implement every High-priority MVP feature for real (working buttons, forms, state changes, navigation between screens). Medium-priority ones if they fit. Never leave TODOs, placeholder text, "coming soon" stubs or dead buttons.
- It should look like a real, modern product: a cohesive colour palette, good spacing, rounded corners, clear hierarchy, hover/active states, smooth small transitions, and a friendly empty state where relevant.
- Fully responsive. For a mobile app, design a phone-sized app layout (max-width around 440px, centred) with bottom or top navigation. For a website or SaaS, a responsive layout that works from phone to desktop.
- For a game: a playable game on <canvas> or the DOM with a title screen, clear instructions, score/progress, win or game-over state, and a restart button. Support keyboard AND touch/click controls. Use requestAnimationFrame for animation.
- Keep the code tidy and reasonably compact (aim for well under 1,500 lines) so it finishes in one go.`;

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function buildUserPrompt({ name, projectType, idea, brief }: BuildAppParams): string {
  return [
    `Build a working web version of "${name}" (project type: ${projectType}).`,
    `Original idea:\n${idea}`,
    `Overview:\n${brief.projectOverview}`,
    `Product goal:\n${brief.productGoal}`,
    `Target user:\n${brief.targetUser}`,
    `MVP features:\n${bulletList(
      brief.mvpFeatures.map((f) => `[${f.priority}] ${f.name}: ${f.description}`)
    )}`,
    `Screens:\n${bulletList(
      brief.screens.map(
        (s) =>
          `${s.name}: ${s.purpose}` +
          (s.components.length ? ` | components: ${s.components.join(", ")}` : "") +
          (s.interactions.length ? ` | interactions: ${s.interactions.join("; ")}` : "")
      )
    )}`,
    `User flow:\n${bulletList(brief.userFlow)}`,
    `UI components:\n${bulletList(brief.uiComponents.map((c) => `${c.name}: ${c.description}`))}`,
    `Definition of done:\n${bulletList(brief.definitionOfDone)}`,
    "The tech stack in the blueprint is for the eventual production build; ignore it here and build the single self-contained HTML file described in your instructions. Output only the HTML document now.",
  ].join("\n\n");
}

const MAX_ATTEMPTS = 2;

async function requestApp(prompt: string): Promise<Anthropic.Message> {
  const anthropic = client();
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const stream = anthropic.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });
      return await stream.finalMessage();
    } catch (error) {
      lastError = error;
      console.error("[app-builder.request]", {
        attempt: attempt + 1,
        message: error instanceof Error ? error.message : String(error),
        status: (error as { status?: unknown })?.status,
      });
      if (attempt >= MAX_ATTEMPTS - 1 || !isRetryable(error)) break;
      await sleep(1000);
    }
  }
  const detail = anthropicErrorMessage(lastError);
  throw new BriefGenerationError(
    detail
      ? `Claude request failed: ${detail}`
      : "Claude didn't respond. Please try building again.",
    { cause: lastError }
  );
}

/** Pulls the HTML document out of the reply, tolerating stray fences or chatter. */
export function extractHtmlDocument(text: string): string | null {
  const withoutFences = text.replace(/```(?:html)?/gi, "");
  const lower = withoutFences.toLowerCase();
  let start = lower.indexOf("<!doctype html");
  if (start === -1) start = lower.indexOf("<html");
  const end = lower.lastIndexOf("</html>");
  if (start === -1 || end === -1 || end < start) return null;
  const html = withoutFences.slice(start, end + "</html>".length).trim();
  return html.toLowerCase().startsWith("<!doctype") ? html : `<!DOCTYPE html>\n${html}`;
}

export async function buildAppHtml(params: BuildAppParams): Promise<string> {
  const message = await requestApp(buildUserPrompt(params));

  if (message.stop_reason === "refusal") {
    throw new BriefGenerationError(
      "Claude declined to build this app. Try adjusting the idea and rebuilding."
    );
  }
  if (message.stop_reason === "max_tokens") {
    throw new BriefGenerationError(
      "The app got too big to finish in one go. Try building again: each build comes out a little different."
    );
  }

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  const html = extractHtmlDocument(text);
  if (!html) {
    throw new BriefGenerationError(
      "Claude's reply didn't contain a complete app. Please try building again."
    );
  }
  return html;
}
