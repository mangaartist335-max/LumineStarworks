import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { fmtNum } from "@/components/ui";
import type { Anime } from "@/data/types";
import { threadsForAnime, threadVisible, visibleSnapshot } from "@/lib/archive";

/**
 * Stand-in for an anime whose profile page is being planned separately.
 * Keeps the entry reachable (threads, characters and credits link here)
 * without showing a profile.
 */
export function PlannedEntry({ anime, asOf }: { anime: Anime; asOf: string }) {
  const threads = threadsForAnime(anime.id).filter((t) => threadVisible(t, asOf) && !t.parentThreadId && t.episode !== undefined);
  return (
    <>
      <Breadcrumb items={[{ label: "Anime", href: "/anime" }, { label: `${anime.title}${anime.year ? ` (${anime.year})` : ""}` }]} />
      <div className="page single">
        <main style={{ maxWidth: 820 }}>
          <div className="page-title">
            <h1>
              {anime.title}
              {anime.titleJapanese && <small>{anime.titleJapanese}</small>}
            </h1>
          </div>
          <div className="box">
            <div className="box-head">Page coming soon</div>
            <div className="box-body">
              <p className="mt-0">The full entry for {anime.title} is being prepared by our Database Contributors. Check back soon!</p>
              {threads.length > 0 && (
                <>
                  <p>
                    <b>Episode discussions</b>
                  </p>
                  <ul className="bb-list">
                    {threads.map((t) => {
                      const snap = visibleSnapshot(t, asOf);
                      return (
                        <li key={t.id}>
                          <Link href={`/forum/thread/${t.id}`}>{t.title}</Link>
                          {snap && <span className="muted"> ({fmtNum(snap.replies)} replies)</span>}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              <p>
                <Link href="/anime" className="btn">
                  &laquo; Browse the anime database
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
