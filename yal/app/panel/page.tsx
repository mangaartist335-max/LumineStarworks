import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { getViewer } from "@/lib/viewer";
import { PICKABLE_AVATARS } from "@/lib/validation";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Panel" };

export default async function PanelPage() {
  const viewer = await getViewer();
  if (!viewer.account) redirect("/login?next=/panel");
  const a = viewer.account;
  return (
    <>
      <Breadcrumb items={[{ label: "Panel" }]} />
      <div className="page">
        <main>
          <div className="page-title">
            <h1>Account Panel</h1>
          </div>
          <div className="box">
            <div className="box-head">Edit Profile</div>
            <div className="box-body">
              <ProfileForm account={a} avatars={[...PICKABLE_AVATARS]} />
            </div>
          </div>
        </main>
        <aside className="sidebar">
          <div className="side-card">
            <div className="side-head">Your Account</div>
            <div className="side-body">
              <table>
                <tbody>
                  <tr>
                    <td className="k">Username</td>
                    <td>{a.username}</td>
                  </tr>
                  <tr>
                    <td className="k">Joined</td>
                    <td>{formatDateTime(a.joinedAt)}</td>
                  </tr>
                  <tr>
                    <td className="k">Data</td>
                    <td>{viewer.mode === "local" ? "Local demo store" : "Supabase"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="side-card">
            <div className="side-head">Shortcuts</div>
            <div className="side-body">
              <ul>
                <li>
                  <Link href={`/profile/${encodeURIComponent(a.username)}`}>My Profile</Link>
                </li>
                <li>
                  <Link href={`/animelist/${encodeURIComponent(a.username)}`}>My Anime List</Link>
                </li>
                <li>
                  <Link href="/forum/following">Followed Topics</Link>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
