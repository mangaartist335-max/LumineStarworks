"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label } from "@/components/ui/Field";
import { GenerateLoadingOverlay } from "@/components/projects/GenerateLoadingOverlay";
import { PROJECT_TYPES, type ProjectType } from "@/lib/types";
import { playSfx } from "@/lib/sfx";

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
    playSfx("start");
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
        playSfx("error");
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push(`/projects/${data.project.id}`);
    } catch {
      playSfx("error");
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
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="DinoRun"
              maxLength={80}
            />
          </div>
          <div>
            <Label htmlFor="projectType">What kind of thing is it?</Label>
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
            Describe your idea
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
          <Label htmlFor="targetUser">Who is it for?</Label>
          <Input
            id="targetUser"
            value={targetUser}
            onChange={(e) => setTargetUser(e.target.value)}
            placeholder="Casual mobile gamers who play in short sessions"
          />
        </div>

        <div>
          <Label htmlFor="extraRequirements" hint="Optional">
            Anything else?
          </Label>
          <Input
            id="extraRequirements"
            value={extraRequirements}
            onChange={(e) => setExtraRequirements(e.target.value)}
            placeholder="e.g. dark mode, a cute pixel-art style, works offline"
          />
        </div>

        <details className="group rounded-lg border border-border px-4 py-3">
          <summary className="cursor-pointer list-none text-sm [&::-webkit-details-marker]:hidden text-muted hover:text-foreground">
            For developers <span className="text-muted-foreground">(optional)</span>
          </summary>
          <div className="mt-3">
            <Label htmlFor="preferredTech" hint="Optional">
              Preferred technology
            </Label>
            <Input
              id="preferredTech"
              value={preferredTech}
              onChange={(e) => setPreferredTech(e.target.value)}
              placeholder="e.g. React Native, or leave empty and we'll choose"
            />
          </div>
        </details>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting}>
          <Sparkles className="h-4 w-4" />
          Plan my app
        </Button>
      </form>
    </>
  );
}
