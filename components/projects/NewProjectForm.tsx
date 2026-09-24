"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label } from "@/components/ui/Field";
import { GenerateLoadingOverlay } from "@/components/projects/GenerateLoadingOverlay";
import { PROJECT_TYPES, type ProjectType } from "@/lib/types";

export function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("Web App");
  const [idea, setIdea] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [preferredTech, setPreferredTech] = useState("");
  const [extraRequirements, setExtraRequirements] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (idea.trim().length < 20) {
      setError("Describe your idea in a bit more detail (at least 20 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Untitled Project",
          projectType,
          idea: idea.trim(),
          targetUser: targetUser.trim() || "General users",
          preferredTech: preferredTech.trim() || null,
          extraRequirements: extraRequirements.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push(`/projects/${data.project.id}`);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <GenerateLoadingOverlay active={submitting} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="DinoRun"
              maxLength={80}
            />
          </div>
          <div>
            <Label htmlFor="projectType">Project type</Label>
            <Select
              id="projectType"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as ProjectType)}
            >
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="idea" hint={`${idea.length} characters`}>
            Idea description
          </Label>
          <Textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={6}
            placeholder="I want to build a dinosaur endless runner with unlockable skins, mobile controls, leaderboards, and a shop. Players tap to jump over obstacles, earn coins as they run, and can spend coins on new dinosaur skins..."
            required
          />
        </div>

        <div>
          <Label htmlFor="targetUser">Target user</Label>
          <Input
            id="targetUser"
            value={targetUser}
            onChange={(e) => setTargetUser(e.target.value)}
            placeholder="Casual mobile gamers who play in short sessions"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="preferredTech" hint="Optional">
              Preferred technology
            </Label>
            <Input
              id="preferredTech"
              value={preferredTech}
              onChange={(e) => setPreferredTech(e.target.value)}
              placeholder="e.g. React Native, or none — let BuildBrief decide"
            />
          </div>
          <div>
            <Label htmlFor="extraRequirements" hint="Optional">
              Extra requirements
            </Label>
            <Input
              id="extraRequirements"
              value={extraRequirements}
              onChange={(e) => setExtraRequirements(e.target.value)}
              placeholder="e.g. must work offline, needs dark mode"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting}>
          <Sparkles className="h-4 w-4" />
          Generate BuildBrief
        </Button>
      </form>
    </>
  );
}
