import { setAsOf } from "@/app/actions/time";
import { ARCHIVE_END, ARCHIVE_START, formatToolbar, toDateInput, toTimeInput } from "@/lib/time";
import Link from "next/link";
import { active, IOE_PHASE, type FuturePhase } from "@/data/release";

// Quick jumps to documented moments in the archive.
const JUMPS = active<{ label: string; at: string; title: string; phase?: FuturePhase }>([
  { label: "Jan 1, 2012", at: "2012-01-01T12:00:00+09:00", title: "the start of the archive" },
  { label: "Jan 24, 2012", at: "2012-01-24T12:00:00+09:00", title: "the morning after the Sinful Apex finale" },
  { label: "Jul 7, 2012", at: "2012-07-07T19:00:00+09:00", title: "Vacant Crown: Liminal War premieres" },
  { label: "Apr 4, 2013", at: "2013-04-04T23:00:00+09:00", title: "Iron to Requiem premieres" },
  { label: "Sep 15, 2013", at: "2013-09-15T12:00:00+09:00", title: "Impact of Eden joins the Fall chart", phase: IOE_PHASE },
  { label: "Sep 27, 2013", at: "2013-09-27T12:00:00+09:00", title: "the day after the Iron to Requiem finale" },
  { label: "Oct 5, 2013", at: "2013-10-05T21:00:00+09:00", title: "hours before the TV premiere", phase: IOE_PHASE },
  { label: "Oct 6, 2013", at: "2013-10-06T09:00:00+09:00", title: "the morning after the premiere", phase: IOE_PHASE },
  { label: "Oct 13, 2013", at: "2013-10-13T12:00:00+09:00", title: "Episode 2 discussion is open", phase: IOE_PHASE },
  { label: "Oct 20, 2013", at: "2013-10-20T12:00:00+09:00", title: "Episode 3 discussion is open", phase: IOE_PHASE },
  { label: "Oct 24, 2013", at: "2013-10-24T12:00:00+09:00", title: "the default visit" },
  { label: "Dec 31, 2013", at: "2013-12-31T23:00:00+09:00", title: "the end of the archive" },
]);

export function ArchiveBar({ asOf, mode }: { asOf: string; mode: "local" | "supabase" }) {
  return (
    <div className="archive-bar" role="region" aria-label="Archive time machine">
      <span className="brand">Lumine StarWorks Archive</span>
      <span>
        Viewing YourAnimeList as of <span className="when">{formatToolbar(asOf)}</span>
      </span>
      <form action={setAsOf} aria-label="Choose an archive date">
        <label className="sr-only" htmlFor="tm-date">Date</label>
        <input
          id="tm-date"
          type="date"
          name="date"
          defaultValue={toDateInput(asOf)}
          min={toDateInput(ARCHIVE_START)}
          max={toDateInput(ARCHIVE_END)}
          key={`d-${asOf}`}
        />
        <label className="sr-only" htmlFor="tm-time">Time (JST)</label>
        <input id="tm-time" type="time" name="time" defaultValue={toTimeInput(asOf)} key={`t-${asOf}`} />
        <button type="submit">Go</button>
      </form>
      <form action={setAsOf} aria-label="Jump to a moment">
        <label className="sr-only" htmlFor="tm-jump">Jump to</label>
        <select id="tm-jump" name="asof" defaultValue="">
          <option value="" disabled>
            Jump to...
          </option>
          {JUMPS.map((j) => (
            <option key={j.label} value={j.at}>
              {j.label} — {j.title}
            </option>
          ))}
        </select>
        <button type="submit">Jump</button>
      </form>
      <span className="spacer" />
      <Link href="/timemachine">About the archive</Link>
      <span className="mode">{mode === "local" ? "Local demo data" : "Supabase"}</span>
    </div>
  );
}
