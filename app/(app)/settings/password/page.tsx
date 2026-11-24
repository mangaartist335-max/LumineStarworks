import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PasswordForm } from "@/components/settings/PasswordForm";

export default function ChangePasswordPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-10 sm:px-8">
      <Link
        href="/settings"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to settings
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <p className="mt-1 text-sm text-muted">At least 8 characters.</p>
      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        <PasswordForm />
      </div>
    </div>
  );
}
