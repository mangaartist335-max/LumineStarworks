import { z } from "zod";
import { PROJECT_TYPES } from "./types";

export const newProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required.").max(80, "Keep the project name under 80 characters."),
  projectType: z.enum(PROJECT_TYPES),
  idea: z
    .string()
    .trim()
    .min(20, "Describe your idea in a bit more detail (at least 20 characters)."),
  targetUser: z.string().trim().min(1, "Tell us who this is for."),
  preferredTech: z.string().trim().max(500).nullable().optional(),
  extraRequirements: z.string().trim().max(2000).nullable().optional(),
});

export type NewProjectInput = z.infer<typeof newProjectSchema>;
