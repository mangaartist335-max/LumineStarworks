import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export default async function SignInPage(props: PageProps<"/auth/sign-in">) {
  const searchParams = await props.searchParams;
  const redirectToParam = searchParams?.redirectTo;
  const redirectTo = Array.isArray(redirectToParam)
    ? redirectToParam[0]
    : redirectToParam || "/dashboard";

  const errorParam = searchParams?.error;
  const initialError =
    (Array.isArray(errorParam) ? errorParam[0] : errorParam) ===
    "confirmation_failed"
      ? "That confirmation link is invalid or has expired. Please sign in, or sign up again."
      : undefined;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/auth/sign-up" className="text-foreground underline underline-offset-4">
            Create one
          </Link>
        </>
      }
    >
      <SignInForm redirectTo={redirectTo} initialError={initialError} />
    </AuthShell>
  );
}
