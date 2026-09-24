import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { buildBriefSchema } from "./brief-schema";
import type { BuildBrief, ProjectType } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const TOOL_NAME = "submit_build_brief";

// Haiku-tier models cap max_tokens far lower than Sonnet/Opus; asking for
// more than a model supports is a 400 at request time, not a soft limit.
const MAX_TOKENS = MODEL.includes("haiku") ? 8192 : 20000;

const RETRYABLE_STATUS_CODES = new Set([408, 409, 429, 500, 502, 503, 529]);

function isRetryable(error: unknown): boolean {
  const status = (error as { status?: unknown })?.status;
  if (typeof status === "number") return RETRYABLE_STATUS_CODES.has(status);
  // Network-level failures (DNS, connection reset, timeout) have no status.
  return error instanceof Error && !("status" in error);
}

function anthropicErrorMessage(error: unknown): string | null {
  const body = (error as { error?: { error?: { message?: unknown } } })
    ?.error?.error;
  if (body && typeof body.message === "string") return body.message;
  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Not using `strict: true` here: BuildBrief's schema is large and deeply
// nested (16 sections, several with nested object arrays), and Claude's
// strict-mode grammar compiler has a real complexity ceiling we exceeded
// ("compiled grammar is too large"). buildBriefSchema itself still
// validates Claude's response afterward, with one repair-retry on failure,
// so strict mode's guarantee isn't load-bearing here.
const briefJsonSchema = (() => {
  const schema = z.toJSONSchema(buildBriefSchema) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
})();

export class BriefGenerationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "BriefGenerationError";
    if (options?.cause) this.cause = options.cause;
  }
}

export interface GenerateBriefParams {
  name: string;
  projectType: ProjectType;
  idea: string;
  targetUser: string;
  preferredTech?: string | null;
  extraRequirements?: string | null;
}

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new BriefGenerationError(
      "AI generation is not configured. Set ANTHROPIC_API_KEY on the server."
    );
  }
  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `You are BuildBrief's planning engine. You turn a rough software idea into a concrete, opinionated, buildable development blueprint that a developer can hand directly to an AI coding agent.

Rules:
- Be specific to THIS idea. Never write generic filler like "make the UI user friendly", "ensure scalability", "use best practices", or "implement authentication if necessary". Every sentence must reference this product's actual domain, entities, and mechanics.
- Aggressively control scope. The MVP must be the smallest version that proves the product's core value. Push every optional, nice-to-have, or speculative idea into "later features" rather than the MVP.
- Prefer concrete, buildable specifics over abstractions. For database fields, name real columns and types. For screens, name real components. For the build plan, name real, achievable tasks that fit in the stated time block.
- The tech stack should match the project's actual needs. Do not recommend infrastructure the product does not need (no message queues, no microservices, no Kubernetes, no vector databases, unless the idea genuinely requires it).
- The 48-hour build plan must be realistic for one developer (or one developer plus an AI coding agent) and favor shipping something complete over building everything partially.
- The Claude Code prompt, CLAUDE.md, and AGENTS.md must be fully self-contained: someone should be able to paste the Claude Code prompt into a coding agent with zero additional back-and-forth about what the app is.
- Write in clear, confident, professional language. No hedging, no meta-commentary about being an AI.

Minimum item counts (the tool call will be rejected and you'll be asked to redo it if these aren't met):
- mvpFeatures: at least 3
- laterFeatures: at least 2
- screens: at least 2
- userFlow: at least 3 steps
- uiComponents: at least 3
- definitionOfDone: at least 4 checklist items
- Every list inside buildPlan (dayOneMorning, dayOneAfternoon, dayOneEvening, dayTwoMorning, dayTwoAfternoon, dayTwoFinalPolish): at least 1 task each

You must respond by calling the ${TOOL_NAME} tool exactly once with the complete blueprint. Do not include any text outside the tool call.`;

function buildUserPrompt(params: GenerateBriefParams): string {
  const lines = [
    `Project name: ${params.name}`,
    `Project type: ${params.projectType}`,
    `Idea description:\n${params.idea}`,
    `Target user: ${params.targetUser}`,
  ];
  if (params.preferredTech) {
    lines.push(`Preferred technology (respect unless a strong reason not to): ${params.preferredTech}`);
  }
  if (params.extraRequirements) {
    lines.push(`Extra requirements to account for: ${params.extraRequirements}`);
  }
  lines.push(
    "Generate the full BuildBrief for this idea by calling the tool now."
  );
  return lines.join("\n\n");
}

// Kept small: the request already runs inside a 60s serverless function
// budget, and generateBuildBrief may call this twice more on top (once for
// the initial attempt, once for a validation repair), so retries here must
// not risk pushing a single call past the time left in that budget.
const MAX_ATTEMPTS = 2;
const RETRY_DELAYS_MS = [800];

async function callClaude(
  messages: Anthropic.MessageParam[]
): Promise<Anthropic.Message> {
  const anthropic = client();

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const stream = anthropic.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages,
        tools: [
          {
            name: TOOL_NAME,
            description:
              "Submit the complete, validated BuildBrief for this project.",
            input_schema: briefJsonSchema as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: "tool", name: TOOL_NAME },
      });
      return await stream.finalMessage();
    } catch (error) {
      lastError = error;
      console.error("[anthropic.callClaude]", {
        attempt: attempt + 1,
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        status: (error as { status?: unknown })?.status,
        errorBody: (error as { error?: unknown })?.error,
      });
      const willRetry = attempt < MAX_ATTEMPTS - 1 && isRetryable(error);
      if (!willRetry) break;
      await sleep(RETRY_DELAYS_MS[attempt] ?? 2500);
    }
  }

  const detail = anthropicErrorMessage(lastError);
  throw new BriefGenerationError(
    detail
      ? `Claude request failed: ${detail}`
      : "Claude did not respond after multiple attempts. Please try again.",
    { cause: lastError }
  );
}

function extractToolInput(message: Anthropic.Message): unknown {
  if (message.stop_reason === "refusal") {
    throw new BriefGenerationError(
      "Claude declined to generate a blueprint for this idea. Try rephrasing your description."
    );
  }
  if (message.stop_reason === "max_tokens") {
    // The response was cut off mid-generation. The tool_use block may still
    // "parse" (some SDKs fall back to a partial/empty object rather than
    // throwing on invalid JSON), so don't trust it — this needs a clear,
    // specific error rather than a confusing downstream validation failure.
    throw new BriefGenerationError(
      "Claude's response was cut off before it finished (too much content for the current output limit). Try a shorter or simpler idea description."
    );
  }
  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new BriefGenerationError(
      "Claude returned an unexpected response format."
    );
  }
  return toolUse.input;
}

export async function generateBuildBrief(
  params: GenerateBriefParams
): Promise<BuildBrief> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildUserPrompt(params) },
  ];

  const first = await callClaude(messages);
  const firstInput = extractToolInput(first);
  const firstResult = buildBriefSchema.safeParse(firstInput);
  if (firstResult.success) {
    return firstResult.data;
  }

  // One repair attempt: tell Claude exactly what was invalid and ask it to
  // resubmit the tool call with corrected data.
  const toolUseBlock = first.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  const issues = firstResult.error.issues
    .slice(0, 20)
    .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  messages.push({ role: "assistant", content: first.content });
  messages.push({
    role: "user",
    content: [
      {
        type: "tool_result",
        tool_use_id: toolUseBlock!.id,
        content: `Your submission failed validation:\n${issues}\n\nCall ${TOOL_NAME} again with corrected, complete data.`,
        is_error: true,
      },
    ],
  });

  const second = await callClaude(messages);
  const secondInput = extractToolInput(second);
  const secondResult = buildBriefSchema.safeParse(secondInput);
  if (secondResult.success) {
    return secondResult.data;
  }

  throw new BriefGenerationError(
    "Claude's response could not be validated into a build brief. Please try again."
  );
}
