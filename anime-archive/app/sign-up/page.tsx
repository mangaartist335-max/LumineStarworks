import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-in-form";
import { archiveMode } from "@/lib/env";

export const metadata: Metadata = { title: "Create an account" };

export default function SignUpPage() {
  if (archiveMode() === "local") redirect("/sign-in");
  return (
    <AuthCard title="Join the archive" description="Create an account. Editors are approved by an archive admin.">
      <SignUpForm />
    </AuthCard>
  );
}
