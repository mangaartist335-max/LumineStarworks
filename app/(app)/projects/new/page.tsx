import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewProjectForm } from "@/components/projects/NewProjectForm";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">
        Describe your idea
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        The more specific you are, the better your BuildBrief will be.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <NewProjectForm />
      </div>
    </div>
  );
}
