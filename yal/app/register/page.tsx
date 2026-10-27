import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RegisterForm } from "@/components/auth/AuthForms";
import { getViewer } from "@/lib/viewer";
import { PICKABLE_AVATARS } from "@/lib/validation";
import { formatLongDate } from "@/lib/time";

export const metadata: Metadata = { title: "Sign Up" };

export default async function RegisterPage() {
  const viewer = await getViewer();
  if (viewer.account) redirect(`/profile/${encodeURIComponent(viewer.account.username)}`);
  return (
    <>
      <Breadcrumb items={[{ label: "Sign Up" }]} />
      <div className="page">
        <main>
          <div className="box">
            <div className="box-head">Create your YourAnimeList account</div>
            <div className="box-body">
              <RegisterForm avatars={[...PICKABLE_AVATARS]} />
            </div>
          </div>
        </main>
        <aside className="sidebar">
          <div className="side-card">
            <div className="side-head">Why join?</div>
            <div className="side-body">
              <ul>
                <li>Keep track of every anime you watch</li>
                <li>Score shows and write reviews</li>
                <li>Join the episode discussions</li>
                <li>Follow topics and make friends</li>
              </ul>
            </div>
          </div>
          <div className="side-card">
            <div className="side-head">Your join date</div>
            <div className="side-body">
              Your profile will say you joined on <b>{formatLongDate(viewer.asOf)}</b>, the date you are visiting. You can post from that day
              onward in the archive.
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
