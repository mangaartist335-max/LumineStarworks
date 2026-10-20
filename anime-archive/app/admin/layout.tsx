import { LogOut, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { requireEditorPage } from "@/lib/auth";
import { loadArchive } from "@/lib/archive/server";
import { signOut } from "../sign-in/actions";

export const metadata: Metadata = { title: { default: "Archive editor", template: "%s · Archive editor" }, robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const viewer = await requireEditorPage();
  const index = await loadArchive();
  const openConflicts = index.tables.record_conflicts.filter((c) => c.status === "open").length;

  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[15rem_1fr]">
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border bg-card/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck aria-hidden className="size-4 text-prov-confirmed" /> {viewer.name}
          </p>
          <p className="mt-0.5 text-xs capitalize text-muted-foreground">
            {viewer.role} · {viewer.mode === "local" ? "local development store" : "Supabase"}
          </p>
          <form action={signOut} className="mt-3">
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start px-2">
              <LogOut aria-hidden /> Sign out
            </Button>
          </form>
        </div>
        <AdminNav openConflicts={openConflicts} />
      </aside>
      <div className="min-w-0">
        {viewer.canEdit ? (
          children
        ) : (
          <div className="rounded-xl border bg-card/60 p-8">
            <h1 className="text-xl font-bold">You&apos;re signed in, but not an editor yet</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Archive changes are limited to editors. Ask an archive admin to grant your account the <strong>editor</strong> role — once it&apos;s set, refresh this
              page and the editor will open.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
