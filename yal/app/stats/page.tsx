import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle, SectionNav } from "@/components/SectionNav";
import { ArchiveNote, fmtNum } from "@/components/ui";
import { visibleAnime, visibleCharacters, visibleCompanies, visibleManga, visiblePeople } from "@/lib/catalog";
import { allArchivePosts, archiveThreads, threadVisible } from "@/lib/archive";
import { visibleMembers } from "@/lib/members";
import { getStore } from "@/lib/store";
import { getViewer } from "@/lib/viewer";
import { formatDate, happened, startOfJstDay, zoneParts } from "@/lib/time";

export const metadata: Metadata = { title: "Site Statistics" };

export default async function SiteStats() {
  const { asOf } = await getViewer();
  const archivePosts = allArchivePosts().filter((p) => happened(p.at, asOf));
  const memberPosts = (await getStore().listMemberPosts()).filter((p) => happened(p.postedAt, asOf));
  const threads = archiveThreads().filter((t) => threadVisible(t, asOf));
  const members = await visibleMembers(asOf);
  const anime = visibleAnime(asOf);

  // Posts per JST day over the last 30 days before the viewed moment.
  const start = startOfJstDay(new Date(new Date(asOf).getTime() - 29 * 86400_000).toISOString());
  const days: { day: string; n: number }[] = [];
  for (let i = 0; i < 30; i++) days.push({ day: new Date(new Date(start).getTime() + i * 86400_000).toISOString(), n: 0 });
  for (const p of [...archivePosts.map((x) => x.at), ...memberPosts.map((x) => x.postedAt)]) {
    const t = new Date(p).getTime();
    const idx = Math.floor((t - new Date(start).getTime()) / 86400_000);
    if (idx >= 0 && idx < 30) days[idx].n++;
  }
  const max = Math.max(1, ...days.map((d) => d.n));
  const byType = Object.entries(
    anime.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxType = Math.max(1, ...byType.map(([, n]) => n));

  return (
    <>
      <Breadcrumb items={[{ label: "Community", href: "/community" }, { label: "Statistics" }]} />
      <div className="page single">
        <main>
          <PageTitle title="Site Statistics" attached />
          <SectionNav section="community" active="/stats" />
          <div className="box" style={{ borderTop: "none" }}>
            <div className="box-body">
              <div className="stat-grid">
                <div className="stat-tile">
                  Anime entries<b>{fmtNum(anime.length)}</b>
                </div>
                <div className="stat-tile">
                  Manga entries<b>{fmtNum(visibleManga(asOf).length)}</b>
                </div>
                <div className="stat-tile">
                  Characters<b>{fmtNum(visibleCharacters(asOf).length)}</b>
                </div>
                <div className="stat-tile">
                  People<b>{fmtNum(visiblePeople(asOf).length)}</b>
                </div>
                <div className="stat-tile">
                  Companies<b>{fmtNum(visibleCompanies(asOf).length)}</b>
                </div>
                <div className="stat-tile">
                  Members<b>{fmtNum(members.length)}</b>
                </div>
                <div className="stat-tile">
                  Forum topics<b>{fmtNum(threads.length)}</b>
                </div>
                <div className="stat-tile">
                  Forum posts<b>{fmtNum(archivePosts.length + memberPosts.length)}</b>
                </div>
              </div>
            </div>
          </div>

          <div className="box">
            <div className="box-head">Forum posts per day (last 30 days, JST)</div>
            <div className="box-body">
              <div className="col-chart" role="img" aria-label="Forum posts per day">
                {days.map((d) => (
                  <div key={d.day} className="col" style={{ height: `${(d.n / max) * 100}%` }} title={`${formatDate(d.day)}: ${d.n} posts`} />
                ))}
              </div>
              <div className="col-labels">
                {days.map((d) => (
                  <span key={d.day}>{zoneParts(d.day).d}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="box">
            <div className="box-head">Database by type</div>
            <div className="box-body bars">
              {byType.map(([type, n]) => (
                <div className="bar-row" key={type}>
                  <span>{type === "Unknown" ? "Format unknown" : type}</span>
                  <div className="bar">
                    <div className="fill accent" style={{ width: `${(n / maxType) * 100}%` }} />
                  </div>
                  <span className="val">{n}</span>
                </div>
              ))}
            </div>
          </div>
          <ArchiveNote>
            Everything here is counted from records that existed at {formatDate(asOf)}. Archived aggregate counts (like a thread&apos;s captured reply total) are
            shown on their own pages and are never mixed into these live counts. See <Link href="/timemachine">About the archive</Link>.
          </ArchiveNote>
        </main>
      </div>
    </>
  );
}
