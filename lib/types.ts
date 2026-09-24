export const PROJECT_TYPES = [
  "Web App",
  "Mobile App",
  "SaaS",
  "Game",
  "Website",
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
  created_at: string;
  updated_at: string;
}

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
}

export interface BriefSectionMeta {
  id: string;
  label: string;
}

export const BRIEF_SECTIONS: BriefSectionMeta[] = [
  { id: "overview", label: "Project Overview" },
  { id: "goal", label: "Product Goal" },
  { id: "target-user", label: "Target User" },
  { id: "mvp-features", label: "MVP Features" },
  { id: "later-features", label: "Later Features" },
  { id: "screens", label: "Screens / Pages" },
  { id: "user-flow", label: "User Flow" },
  { id: "tech-stack", label: "Tech Stack" },
  { id: "database", label: "Database Plan" },
  { id: "structure", label: "Project Structure" },
  { id: "components", label: "UI Components" },
  { id: "build-plan", label: "48-Hour Build Plan" },
  { id: "definition-of-done", label: "Definition of Done" },
  { id: "claude-prompt", label: "Claude Code Prompt" },
  { id: "claude-md", label: "CLAUDE.md" },
  { id: "agents-md", label: "AGENTS.md" },
];
