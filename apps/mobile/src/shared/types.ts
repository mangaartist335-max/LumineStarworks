// Shared with the website: keep in sync with /lib/types.ts.
// (Copied rather than imported so the mobile bundler stays self-contained.)

export const PROJECT_TYPES = [
  "Web App",
  "Mobile App",
  "SaaS",
  "Game",
  "Website",
  "Desktop App",
  "AI App",
  "Productivity App",
  "Business App",
  "Developer Tool",
  "Other",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_STATUSES = [
  "planning",
  "ready_to_build",
  "building",
  "completed",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  ready_to_build: "Ready to Build",
  building: "Building",
  completed: "Completed",
};

export interface ProjectRow {
  archived_at?: string | null;
  task_progress?: Record<string, boolean> | null;
  id: string;
  user_id: string;
  name: string;
  project_type: ProjectType;
  idea: string;
  target_user: string;
  preferred_tech: string | null;
  extra_requirements: string | null;
  status: ProjectStatus;
  generated_brief: BuildBrief | null;
  generation_status: GenerationStatus | null;
  generation_error: string | null;
  generation_started_at: string | null;
  app_html: string | null;
  app_status: AppBuildStatus | null;
  app_error: string | null;
  app_started_at: string | null;
  created_at: string;
  updated_at: string;
}

export type GenerationStatus = "generating" | "done" | "failed";
export type AppBuildStatus = "building" | "done" | "failed";

// Generation runs in the background after the API responds. The routes'
// `maxDuration` must be a literal (Next.js reads it statically), so keep it
// in sync with this value by hand.
export const GENERATION_MAX_SECONDS = 300;

export interface ProfileRow {
  id: string;
  display_name: string | null;
  created_at: string;
}

export type FeaturePriority = "High" | "Medium" | "Low";

export interface MvpFeature {
  name: string;
  description: string;
  priority: FeaturePriority;
}

export interface LaterFeature {
  name: string;
  description: string;
}

export interface Screen {
  name: string;
  purpose: string;
  components: string[];
  interactions: string[];
}

export interface TechStack {
  frontend: string;
  backend: string;
  database: string;
  authentication: string;
  hosting: string;
  aiServices: string | null;
}

export interface DatabaseTable {
  table: string;
  purpose: string;
  fields: string[];
}

export interface UiComponent {
  name: string;
  description: string;
}

export interface BuildPlan {
  dayOneMorning: string[];
  dayOneAfternoon: string[];
  dayOneEvening: string[];
  dayTwoMorning: string[];
  dayTwoAfternoon: string[];
  dayTwoFinalPolish: string[];
}

export interface BuildBrief {
  projectOverview: string;
  productGoal: string;
  targetUser: string;
  mvpFeatures: MvpFeature[];
  laterFeatures: LaterFeature[];
  screens: Screen[];
  userFlow: string[];
  techStack: TechStack;
  databasePlan: DatabaseTable[];
  projectStructure: string;
  uiComponents: UiComponent[];
  buildPlan: BuildPlan;
  definitionOfDone: string[];
  claudePrompt: string;
  claudeMd: string;
  agentsMd: string;
  architecture?: string;
  apiRequirements?: string[];
  testingPlan?: string[];
  deploymentPlan?: string;
}
