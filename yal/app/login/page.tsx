import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LoginForm } from "@/components/auth/AuthForms";
import { getViewer } from "@/lib/viewer";
import { safeNext } from "@/lib/validation";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const viewer = await getViewer();
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next, "");
  if (viewer.account) redirect(next || `/profile/${encodeURIComponent(viewer.account.username)}`);
  return (
    <>
      <Breadcrumb items={[{ label: "Login" }]} />
      <div className="page single">
        <main style={{ maxWidth: 640 }}>
          <div className="box">
            <div className="box-head">Login to YourAnimeList</div>
            <div className="box-body">
              <LoginForm next={next} mode={viewer.mode} />
              {viewer.mode === "local" && (
                <p className="hint">Local demo mode: accounts are stored on this server in .data/yal.local.json.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
