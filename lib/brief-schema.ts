import { z } from "zod";

const nonEmpty = (label: string) =>
  z.string().min(1, `${label} is required`);

const featureSchema = z.object({
  name: nonEmpty("Feature name").describe(
    "Short, specific feature name, e.g. 'Endless run loop with speed ramp'"
  ),
  description: nonEmpty("Feature description").describe(
    "One to two concrete sentences describing exactly what this feature does in this product"
  ),
  priority: z
    .enum(["High", "Medium", "Low"])
    .describe("Build priority within the MVP"),
});

const laterFeatureSchema = z.object({
  name: nonEmpty("Feature name"),
  description: nonEmpty("Feature description").describe(
    "Why this is valuable but deliberately excluded from the MVP"
  ),
});

const screenSchema = z.object({
  name: nonEmpty("Screen name"),
  purpose: nonEmpty("Screen purpose"),
  components: z
    .array(nonEmpty("Component"))
    .min(1)
    .describe("Concrete UI components that appear on this screen"),
  interactions: z
    .array(nonEmpty("Interaction"))
    .min(1)
    .describe("The important things a user can do on this screen"),
});

const techStackSchema = z.object({
  frontend: nonEmpty("Frontend stack"),
  backend: nonEmpty("Backend stack"),
  database: nonEmpty("Database"),
  authentication: nonEmpty("Authentication approach"),
  hosting: nonEmpty("Hosting/deployment target"),
  aiServices: z
    .string()
    .nullable()
    .describe("AI/ML services used, or null if not applicable to this product"),
});

const databaseTableSchema = z.object({
  table: nonEmpty("Table name"),
  purpose: nonEmpty("Table purpose"),
  fields: z
    .array(nonEmpty("Field"))
    .min(1)
    .describe(
      "Concrete column list, e.g. 'id uuid primary key', 'user_id uuid references users(id)'"
    ),
});

const uiComponentSchema = z.object({
  name: nonEmpty("Component name"),
  description: nonEmpty("Component description"),
});

const buildPlanSchema = z.object({
  dayOneMorning: z.array(nonEmpty("Task")).min(1),
  dayOneAfternoon: z.array(nonEmpty("Task")).min(1),
  dayOneEvening: z.array(nonEmpty("Task")).min(1),
  dayTwoMorning: z.array(nonEmpty("Task")).min(1),
  dayTwoAfternoon: z.array(nonEmpty("Task")).min(1),
  dayTwoFinalPolish: z.array(nonEmpty("Task")).min(1),
});

export const buildBriefSchema = z.object({
  projectOverview: nonEmpty("Project overview").describe(
    "2-4 sentences explaining concretely what this product is"
  ),
  productGoal: nonEmpty("Product goal").describe(
    "The problem it solves and what the MVP must accomplish"
  ),
  targetUser: nonEmpty("Target user").describe(
    "Who the first version is built for"
  ),
  mvpFeatures: z
    .array(featureSchema)
    .min(3)
    .max(10)
    .describe("Only the features required for a convincing V1"),
  laterFeatures: z
    .array(laterFeatureSchema)
    .min(2)
    .max(10)
    .describe("Good ideas deliberately excluded from the MVP"),
  screens: z.array(screenSchema).min(2).max(12),
  userFlow: z
    .array(nonEmpty("Step"))
    .min(3)
    .describe("Ordered steps describing the primary path through the product"),
  techStack: techStackSchema,
  databasePlan: z
    .array(databaseTableSchema)
    .min(0)
    .max(10)
    .describe("Required tables only; empty array if no database is needed"),
  projectStructure: nonEmpty("Project structure").describe(
    "A sensible folder structure rendered as a plain-text tree"
  ),
  uiComponents: z.array(uiComponentSchema).min(3).max(20),
  buildPlan: buildPlanSchema,
  definitionOfDone: z
    .array(nonEmpty("Checklist item"))
    .min(4)
    .describe("What must work before the MVP can be considered complete"),
  claudePrompt: nonEmpty("Claude Code prompt").describe(
    "A detailed, self-contained prompt a developer can paste directly into Claude Code to start building this exact project, with enough context that no further explanation is needed"
  ),
  claudeMd: nonEmpty("CLAUDE.md").describe(
    "Full contents of a CLAUDE.md file with reusable, project-specific instructions"
  ),
  agentsMd: nonEmpty("AGENTS.md").describe(
    "Full contents of a concise AGENTS.md file with repository-level agent instructions"
  ),
});

export type BuildBriefInput = z.infer<typeof buildBriefSchema>;
