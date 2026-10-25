import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle } from "@/components/SectionNav";
import { fmtNum } from "@/components/ui";
import { ARCHIVE_STATS } from "@/lib/archive";
import { seedThreads } from "@/data/forums";
import { seedReviews } from "@/data/community";
import { getViewer } from "@/lib/viewer";
import { FUTURE_PHASES, IOE_PHASE, phaseEnabled } from "@/data/release";
import { ARCHIVE_END, ARCHIVE_START, DEFAULT_AS_OF, formatToolbar } from "@/lib/time";

export const metadata: Metadata = { title: "About the Archive" };

export default async function TimeMachinePage() {
  const { asOf, mode } = await getViewer();
  const ioe = phaseEnabled(IOE_PHASE);
  return (
    <>
      <Breadcrumb items={[{ label: "About the archive" }]} />
      <div className="page">
        <main>
          <PageTitle title="Lumine StarWorks Archive: YourAnimeList, 2012–2013" />
          <div className="box">
            <div className="box-head">How the time machine works</div>
            <div className="box-body">
              <p className="mt-0">
                You are browsing YourAnimeList as it existed at a chosen moment, currently <b>{formatToolbar(asOf)}</b>. Pick any time between{" "}
                {formatToolbar(ARCHIVE_START)} and {formatToolbar(ARCHIVE_END)} from the toolbar at the top of every page. The default visit is{" "}
                {formatToolbar(DEFAULT_AS_OF)}.
              </p>
              <ul className="bb-list">
                <li>Entries, characters, credits and news appear only from the moment they existed.</li>
                <li>Character biographies reveal facts only after the episode that showed them has aired.</li>
                <li>Forum threads open at their recorded creation time; replies appear one by one at their timestamps.</li>
                <li>
                  Aggregate numbers captured in archive snapshots (reply and view totals, polls, &quot;users viewing&quot;) are shown only once the snapshot was taken,
                  and are labelled as such.
                </li>
                <li>
                  Broadcast times use JST and the Japanese late-night convention (Saturday 25:58 is Sunday 01:58). Post timestamps keep the time zone each
                  member used.
                </li>
                <li>The real current date is never used to decide what is shown.</li>
              </ul>
              <p>
                Shareable links: add <code className="bb-code-inline">?asof=2013-10-06</code> or <code className="bb-code-inline">?asof=2013-10-06T09:00</code> (JST) to any address.
              </p>
            </div>
          </div>

          <div className="box">
            <div className="box-head">What&apos;s in the archive</div>
            <table className="yal-table">
              <thead>
                <tr>
                  <th>Records</th>
                  <th>Provenance</th>
                </tr>
              </thead>
              <tbody>
                {ioe && (
                <tr>
                  <td>
                    Impact of Eden Episode 1–3 discussion threads: {fmtNum(ARCHIVE_STATS.posts)} posts by {fmtNum(ARCHIVE_STATS.members)} members
                  </td>
                  <td>
                    <span className="tag teal">archived</span> recovered from the archived YAL pages
                  </td>
                </tr>
                )}
                <tr>
                  <td>{ioe ? "Impact of Eden, Iron to Requiem and the Nightpolis Winter OVA" : "Iron to Requiem"}: credits, cast, studios and dates</td>
                  <td>
                    <span className="tag teal">documented</span> from the established Lumine StarWorks references; unknown facts are left blank
                  </td>
                </tr>
                <tr>
                  <td>
                    Full entries for Sinful Apex, Zero Latitude, Skyfall Chronicle, River of Sparks, Steelbound Testament, Glass Cathedral, Circuit Hearts:
                    Reload, Vacant Crown, Ghost Eater, Azure Sorcerer and Neon Afterimage
                  </td>
                  <td>
                    <span className="tag gold">reconstructed</span> written around the documented facts (studios, dates, directors and other established credits)
                  </td>
                </tr>
                <tr>
                  <td>
                    {seedThreads.length} general forum threads, {seedReviews.length} reviews, recommendations and news post copy
                  </td>
                  <td>
                    <span className="tag gold">reconstructed</span> sample content written in the archive&apos;s voice, labelled in each record
                  </td>
                </tr>
                <tr>
                  <td>Archive members&apos; anime lists</td>
                  <td>
                    <span className="tag">derived</span> from posting in episode threads
                  </td>
                </tr>
                <tr>
                  <td>Accounts, lists, replies and reviews created by visitors</td>
                  <td>
                    <span className="tag">member</span> stored in {mode === "local" ? "the local demo store" : "Supabase"}, stamped with the archive moment they were made
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="box">
            <div className="box-head">Known gaps</div>
            <div className="box-body">
              <ul className="bb-list">
                {ioe ? (
                  <>
                    <li>The Impact of Eden profile page is coming soon; its episode threads, characters and staff pages are available now.</li>
                    <li>Impact of Eden episode records after Episode 3 have not been archived.</li>
                    <li>Impact of Eden: Nightpolis Winter (2005 OVA) has no documented staff, cast, release date or episode count yet.</li>
                  </>
                ) : (
                  <li>{FUTURE_PHASES[IOE_PHASE]}: held back from this version of the archive.</li>
                )}
                <li>Destiny/Infinite, Blizzard Requiem, Pale Garden Reverie, Garden of Cinders and Iron Halo Brigade are listed with their documented credits only.</li>
                <li>Posts inside the &quot;hot subthreads&quot; listed in each episode thread were not recovered.</li>
              </ul>
            </div>
          </div>
        </main>
        <aside className="sidebar">
          <div className="side-card">
            <div className="side-head">Try these moments</div>
            <div className="side-body">
              <ul>
                <li>
                  <Link href="/anime/4407/Glass_Cathedral?asof=2012-02-01">Feb 1, 2012</Link> &mdash; Glass Cathedral mid-season
                </li>
                <li>
                  <Link href="/anime/season/2012/summer?asof=2012-08-01">Aug 1, 2012</Link> &mdash; Summer 2012 chart
                </li>
                {ioe ? (
                  <>
                    <li>
                      <Link href="/forum/thread/ioe-ep1?asof=2013-10-06T03:00">Oct 6, 03:00</Link> &mdash; Episode 1 thread, half an hour old
                    </li>
                    <li>
                      <Link href="/character/1/Sora_Gauthier?asof=2013-10-12">Oct 12</Link> &mdash; Sora&apos;s bio before Episode 2
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link href="/forum/thread/t-21990?asof=2012-01-24T03:00">Jan 24, 2012</Link> &mdash; Sinful Apex finale thread, minutes old
                    </li>
                    <li>
                      <Link href="/anime/16592/Iron_to_Requiem?asof=2013-06-01">Jun 1, 2013</Link> &mdash; Iron to Requiem mid-season
                    </li>
                  </>
                )}
                <li>
                  <Link href="/anime/season/2013/spring?asof=2013-05-01">May 1</Link> &mdash; Spring 2013 chart
                </li>
                <li>
                  <Link href="/forum/board/recommendations?asof=2012-02-01">Feb 1, 2012</Link> &mdash; recommendations board
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
