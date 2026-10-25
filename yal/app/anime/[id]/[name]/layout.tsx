import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AnimeTabs } from "@/components/anime/AnimeTabs";
import { PlannedEntry } from "@/components/anime/PlannedEntry";
import { Cover, InfoRow, NA, fmtNum } from "@/components/ui";
import { quickAddAction } from "@/app/actions/list";
import { airedText, episodesText, loadAnime } from "@/lib/anime-page";
import {
  animeCompanies,
  animeLicensors,
  animeStatus,
  allCompanies,
  animeUrl,
  companyUrl,
  latestScore,
} from "@/lib/catalog";
import { getViewer } from "@/lib/viewer";
import { getStore } from "@/lib/store";
import { animeStats, popularityRank, scoreRank } from "@/lib/stats";
import { LIST_STATUSES } from "@/lib/store/types";
import { formatDate, formatDateTime, happened, seasonLabel } from "@/lib/time";
import type { Company } from "@/data/types";

function CompanyLinks({ list }: { list: Company[] }) {
  if (list.length === 0) return <NA>None found</NA>;
  return (
    <>
      {list.map((c, i) => (
        <span key={c.id}>
          {i > 0 && ", "}
          <Link href={companyUrl(c)}>{c.name}</Link>
        </span>
      ))}
    </>
  );
}

export default async function AnimeLayout(props: LayoutProps<"/anime/[id]/[name]">) {
  const { id } = await props.params;
  const load = await loadAnime(id);
  if (load.state === "later") {
    return (
      <>
        <Breadcrumb items={[{ label: "Anime", href: "/anime" }, { label: "Not in database yet" }]} />
        <div className="page single">
          <main>
            <div className="box">
              <div className="box-head">This entry is not in the database yet</div>
              <div className="box-body">
                <p>No anime with this ID exists at this point in time.</p>
                <p className="hint">The entry is added on {formatDate(load.listedAt)}. Use the archive toolbar to travel forward.</p>
                <Link href="/anime" className="btn">
                  &laquo; Browse the anime database
                </Link>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }
  const { anime, asOf } = load;
  if (anime.pagePlanned) return <PlannedEntry anime={anime} asOf={asOf} />;
  const viewer = await getViewer();
  const base = animeUrl(anime);
  const status = animeStatus(anime, asOf);
  const score = latestScore(anime, asOf);
  const stats = await animeStats(anime.id, asOf);
  const popularity = await popularityRank(anime, asOf);
  const rank = scoreRank(anime, asOf);
  const entry = viewer.account ? await getStore().getListEntry(viewer.account.id, anime.id) : null;
  const myEntry = entry && happened(entry.updatedAt, asOf) ? entry : null;
  const licensors = animeLicensors(anime, asOf);

  return (
    <>
      <Breadcrumb items={[{ label: "Anime", href: "/anime" }, { label: `${anime.title}${anime.year ? ` (${anime.year})` : ""}` }]} />
      <div className="page left-side">
        <aside className="sidebar">
          <Cover src={anime.cover} title={anime.title} />

          <div className="list-actions">
            {viewer.account ? (
              myEntry ? (
                <>
                  <div className="notice ok" style={{ margin: 0 }}>
                    On your list: <b>{myEntry.status}</b>
                    <br />
                    Episodes: {myEntry.episodesWatched}/{anime.episodesPlanned ?? "?"} &middot; Score: {myEntry.score ?? "-"}
                  </div>
                  <Link href={`/ownlist/anime/${anime.id}/edit`} className="btn primary">
                    Edit My List
                  </Link>
                </>
              ) : (
                <>
                  <form action={quickAddAction} style={{ display: "grid", gap: 5 }}>
                    <input type="hidden" name="animeId" value={anime.id} />
                    <label className="sr-only" htmlFor="quick-status">
                      Status
                    </label>
                    <select id="quick-status" name="status" className="field" defaultValue={status === "Not yet aired" ? "Plan to Watch" : "Watching"}>
                      {LIST_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button type="submit" className="btn primary">
                      Add to My List
                    </button>
                  </form>
                  <Link href={`/ownlist/anime/${anime.id}/edit`} className="btn">
                    Edit My List
                  </Link>
                </>
              )
            ) : (
              <>
                <Link href={`/login?next=${encodeURIComponent(base)}`} className="btn primary">
                  Add to My List
                </Link>
                <Link href={`/login?next=${encodeURIComponent(`/ownlist/anime/${anime.id}/edit`)}`} className="btn">
                  Edit My List
                </Link>
              </>
            )}
          </div>

          <div className="side-card">
            <div className="side-head">Alternative Titles</div>
            <div className="side-body info-list">
              {anime.synonyms.length > 0 && <InfoRow k="Synonyms">{anime.synonyms.join(", ")}</InfoRow>}
              {anime.titleJapanese ? (
                <InfoRow k="Japanese">
                  {anime.titleJapanese}
                  {anime.titleRomaji && <span className="muted"> ({anime.titleRomaji})</span>}
                </InfoRow>
              ) : (
                <InfoRow k="Japanese">
                  <NA>Not documented</NA>
                </InfoRow>
              )}
            </div>
          </div>

          <div className="side-card">
            <div className="side-head">Information</div>
            <div className="side-body info-list">
              <InfoRow k="Type">{anime.type === "Unknown" ? <NA>Unknown</NA> : anime.type}</InfoRow>
              <InfoRow k="Episodes">{anime.episodesPlanned !== null ? episodesText(anime) : <NA>Unknown</NA>}</InfoRow>
              <InfoRow k="Status">{status === "Not documented" ? <NA>Not documented</NA> : status}</InfoRow>
              <InfoRow k="Aired">{airedText(anime, asOf) === "Not documented" ? <NA>Not documented</NA> : airedText(anime, asOf)}</InfoRow>
              {anime.premiered && (
                <InfoRow k="Premiered">
                  <Link href={`/anime/season/${anime.premiered.year}/${anime.premiered.season}`}>{seasonLabel(anime.premiered.season, anime.premiered.year)}</Link>
                </InfoRow>
              )}
              {anime.broadcast && <InfoRow k="Broadcast">{anime.broadcast}</InfoRow>}
              <InfoRow k="Producers">
                <CompanyLinks list={animeCompanies(anime.producers, asOf)} />
              </InfoRow>
              <InfoRow k="Licensors">
                <CompanyLinks list={licensors} />
              </InfoRow>
              <InfoRow k="Studios">
                <CompanyLinks list={animeCompanies(anime.studios, asOf)} />
              </InfoRow>
              <InfoRow k="Source">{anime.source ?? <NA>Not documented</NA>}</InfoRow>
              <InfoRow k="Genres">
                {anime.genres.length ? (
                  anime.genres.map((g, i) => (
                    <span key={g}>
                      {i > 0 && ", "}
                      <Link href={`/anime?genre=${encodeURIComponent(g)}`}>{g}</Link>
                    </span>
                  ))
                ) : (
                  <NA>Not documented</NA>
                )}
              </InfoRow>
              <InfoRow k="Themes">{anime.themes.length ? anime.themes.join(", ") : <NA>Not documented</NA>}</InfoRow>
              <InfoRow k="Duration">{anime.duration ?? <NA>Not documented</NA>}</InfoRow>
              <InfoRow k="Rating">{anime.rating ?? <NA>Not documented</NA>}</InfoRow>
            </div>
          </div>

          <div className="side-card">
            <div className="side-head">Statistics</div>
            <div className="side-body info-list">
              <InfoRow k="Score">
                {score ? (
                  <>
                    <b>{score.score.toFixed(2)}</b> <span className="muted">(scored by {fmtNum(score.scoredBy)} users)</span>
                  </>
                ) : (
                  <NA />
                )}
              </InfoRow>
              <InfoRow k="Ranked">{rank ? `#${rank}` : <NA />}</InfoRow>
              <InfoRow k="Popularity">{popularity ? `#${popularity}` : <NA />}</InfoRow>
              <InfoRow k="Members">{fmtNum(stats.members)}</InfoRow>
              <InfoRow k="Favorites">{fmtNum(stats.favorites)}</InfoRow>
              {score && <div className="hint">Score archived {formatDateTime(score.capturedAt)}.</div>}
            </div>
          </div>

          {anime.streaming && anime.streaming.some((s) => happened(s.visibleFrom, asOf)) && (
            <div className="side-card">
              <div className="side-head">Streaming</div>
              <div className="side-body">
                <ul>
                  {anime.streaming
                    .filter((s) => happened(s.visibleFrom, asOf))
                    .map((s) => {
                      const company = allCompanies.find((c) => c.name === s.name);
                      return (
                        <li key={s.name}>
                          {company ? <Link href={companyUrl(company)}>{s.name}</Link> : s.name} &mdash; {s.note}
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
          )}
        </aside>

        <main>
          <div className="page-title" style={{ marginBottom: 0 }}>
            <h1>
              {anime.title}
              {anime.titleJapanese && <small>{anime.titleJapanese}</small>}
            </h1>
          </div>
          <AnimeTabs base={base} />
          <div className="box" style={{ borderTop: "none" }}>
            <div className="box-body">{props.children}</div>
          </div>
        </main>
      </div>
    </>
  );
}
