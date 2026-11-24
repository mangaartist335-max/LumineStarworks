import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewProjectForm } from "@/components/projects/NewProjectForm";
import { DAILY_GENERATION_LIMIT, DAILY_APP_BUILD_LIMIT } from "@/lib/generation-limit";

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
        What do you want to make?
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Describe it in your own words. The more detail you give, the better your app turns out.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        You can make up to {DAILY_GENERATION_LIMIT} plans and {DAILY_APP_BUILD_LIMIT} app builds every 24 hours.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <NewProjectForm />
      </div>
    </div>
  );
}
