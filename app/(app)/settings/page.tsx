import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DisplayNameForm } from "@/components/settings/DisplayNameForm";
import { signOutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted">Manage your account.</p>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        <div className="mt-4 space-y-5">
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">Email</p>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
          <DisplayNameForm displayName={profile?.display_name || ""} />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold text-foreground">Session</h2>
        <p className="mt-1.5 text-sm text-muted">
          Sign out of BuildBrief on this device.
        </p>
        <form action={signOutAction} className="mt-4">
          <Button type="submit" variant="secondary">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
