import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { buildBriefSchema } from "./brief-schema";
import type { BuildBrief, ProjectType } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const TOOL_NAME = "submit_build_brief";

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

async function callClaude(
  messages: Anthropic.MessageParam[]
): Promise<Anthropic.Message> {
  const anthropic = client();
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 20000,
    system: SYSTEM_PROMPT,
    messages,
    tools: [
      {
        name: TOOL_NAME,
        description:
          "Submit the complete, validated BuildBrief for this project.",
        input_schema: briefJsonSchema as Anthropic.Tool.InputSchema,
        strict: true,
      },
    ],
    tool_choice: { type: "tool", name: TOOL_NAME },
  });

  try {
    return await stream.finalMessage();
  } catch (error) {
    console.error("[anthropic.callClaude]", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      status: (error as { status?: unknown })?.status,
      errorBody: (error as { error?: unknown })?.error,
    });
    throw new BriefGenerationError(
      "Claude did not respond. Please try again.",
      { cause: error }
    );
  }
}

function extractToolInput(message: Anthropic.Message): unknown {
  if (message.stop_reason === "refusal") {
    throw new BriefGenerationError(
      "Claude declined to generate a blueprint for this idea. Try rephrasing your description."
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
