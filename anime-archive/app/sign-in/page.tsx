import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getViewer } from "@/lib/auth";
import { archiveMode } from "@/lib/env";

export const metadata: Metadata = { title: "Editor sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next } = await searchParams;
  const target = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
  const viewer = await getViewer();
  if (viewer.signedIn) redirect(target);
  const mode = archiveMode();
  return (
    <AuthCard
      title="Archive editor"
      description={mode === "local" ? "Sign in to edit the local development archive." : "Sign in with your Lumine StarWorks archive account."}
    >
      <SignInForm mode={mode} next={target} />
    </AuthCard>
  );
}
