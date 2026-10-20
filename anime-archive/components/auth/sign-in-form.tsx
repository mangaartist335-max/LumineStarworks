"use client";

import { KeyRound, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/sign-in/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm({ mode, next }: { mode: "local" | "supabase"; next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      {mode === "local" ? (
        <div className="space-y-2">
          <Label htmlFor="passcode">Editor passcode</Label>
          <Input id="passcode" name="passcode" type="password" autoComplete="current-password" required aria-invalid={!!state.error} aria-describedby="passcode-help" />
          <p id="passcode-help" className="text-xs text-muted-foreground">
            Local development mode. The passcode comes from <code className="font-mono">LOCAL_EDITOR_PASSCODE</code> (it defaults to{" "}
            <code className="font-mono">starworks</code> while running <code className="font-mono">npm run dev</code>).
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!state.error} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={!!state.error} />
          </div>
        </>
      )}
      {state.error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle aria-hidden className="animate-spin" /> : <KeyRound aria-hidden />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      {mode === "supabase" && (
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      )}
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input id="display_name" name="display_name" autoComplete="nickname" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="rounded-md border border-prov-confirmed/40 bg-prov-confirmed/10 px-3 py-2 text-sm">
          {state.message}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <LoaderCircle aria-hidden className="animate-spin" />}
        Create account
      </Button>
      <p className="text-center text-xs text-muted-foreground">New accounts can browse straight away. An archive admin grants editor access.</p>
    </form>
  );
}
