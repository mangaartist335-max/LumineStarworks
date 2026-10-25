import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveNote, NA, Portrait, fmtNum } from "@/components/ui";
import { ReviewView } from "@/components/anime/ReviewView";
import { loadAnime } from "@/lib/anime-page";
import {
  animeCharacters,
  animeRelations,
  animeStaff,
  animeUrl,
  characterUrl,
  getAnimeAnyTime,
  latestScore,
  personUrl,
  visibleBackground,
  visibleBroadcasts,
  visibleThemeSongs,
} from "@/lib/catalog";
import { boardThreads } from "@/lib/forum";
import { reviewsFor } from "@/lib/reviews";
import { animeStats, popularityRank, scoreRank } from "@/lib/stats";
import { formatBroadcastSlot, formatDate, formatDateTime, relativeTo } from "@/lib/time";

export async function generateMetadata(props: PageProps<"/anime/[id]/[name]">): Promise<Metadata> {
  const { id } = await props.params;
  const a = getAnimeAnyTime(Number(id));
  return { title: a ? a.title : "Anime" };
}

export default async function AnimeOverview(props: PageProps<"/anime/[id]/[name]">) {
  const { id } = await props.params;
  const load = await loadAnime(id);
  if (load.state !== "ok") return null;
  const { anime, asOf } = load;
  const score = latestScore(anime, asOf);
  const stats = await animeStats(anime.id, asOf);
  const popularity = await popularityRank(anime, asOf);
  const rank = scoreRank(anime, asOf);
  const background = visibleBackground(anime, asOf);
  const broadcasts = visibleBroadcasts(anime, asOf);
  const relations = animeRelations(anime, asOf);
  const songs = visibleThemeSongs(anime, asOf);
  const cast = animeCharacters(anime, asOf);
  const staff = animeStaff(anime, asOf);
  const threads = (await boardThreads(null, asOf)).filter((t) => t.thread.animeId === anime.id && !t.thread.parentThreadId).slice(0, 5);
  const reviews = (await reviewsFor(asOf, anime.id)).slice(0, 2);
  const base = animeUrl(anime);

  return (
    <>
      <div className="score-row">
        <div>
          SCORE
          {score ? <span className="big">{score.score.toFixed(2)}</span> : <span className="big na">N/A</span>}
          {score ? `${fmtNum(score.scoredBy)} users` : "not enough scores"}
        </div>
        <div>
          RANKED
          <span className={`big${rank ? "" : " na"}`}>{rank ? `#${rank}` : "N/A"}</span>
        </div>
        <div>
          POPULARITY
          <span className={`big${popularity ? "" : " na"}`}>{popularity ? `#${popularity}` : "N/A"}</span>
        </div>
        <div>
          MEMBERS
          <span className="big">{fmtNum(stats.members)}</span>
        </div>
      </div>

      <h2 className="section-h">
        Synopsis
      </h2>
      {anime.synopsis ? (
        <p>
          {anime.synopsis}
          {anime.synopsisSource && <span className="muted"> [{anime.synopsisSource}]</span>}
        </p>
      ) : (
        <p>
          <NA>No synopsis has been added for this title.</NA>
        </p>
      )}

      <h2 className="section-h">Background</h2>
      {background.length ? background.map((b) => <p key={b}>{b}</p>) : <p><NA>No background information has been added to this title.</NA></p>}

      {broadcasts.length > 0 && (
        <>
          <h2 className="section-h">Broadcast Information</h2>
          <table className="yal-table">
            <thead>
              <tr>
                <th>Broadcast</th>
                <th>Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {broadcasts.map((b) => {
                // Times are only shown when documented (date-only events are stored at 00:00 JST).
                const slot = b.at ? formatBroadcastSlot(b.at) : null;
                const timeKnown = Boolean(b.at && !formatDateTime(b.at).endsWith("00:00 JST"));
                return (
                  <tr key={b.label}>
                    <td>
                      {b.label}
                      {b.scheduled && <span className="tag gold" style={{ marginLeft: 4 }}>scheduled</span>}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {slot ? (
                        <>
                          {timeKnown ? slot.date : formatDate(b.at!)}
                          {timeKnown && (
                            <span className="sub">
                              {slot.weekday} {slot.time} JST
                            </span>
                          )}
                        </>
                      ) : (
                        <NA>TBA</NA>
                      )}
                    </td>
                    <td className="muted">{b.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      <h2 className="section-h">Related Entries</h2>
      {relations.length ? (
        <table className="yal-table">
          <tbody>
            {relations.map((r) => (
              <tr key={r.url + r.kind}>
                <td style={{ width: 110 }}>
                  <b>{r.kind}:</b>
                </td>
                <td>
                  <Link href={r.url}>{r.title}</Link> <span className="muted">({r.type})</span>
                  {r.note && <span className="sub">{r.note}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p><NA>No related entries.</NA></p>
      )}

      <div className="two-col" style={{ marginTop: 12 }}>
        <div>
          <h2 className="section-h">Opening Theme</h2>
          {songs.filter((s) => s.kind === "Opening").length ? (
            songs
              .filter((s) => s.kind === "Opening")
              .map((s, i) => (
                <p key={s.title} className="small">
                  #{i + 1}: &quot;{s.title}&quot; by {s.artist}
                  {s.note && <span className="sub muted">{s.note}</span>}
                </p>
              ))
          ) : (
            <p className="small"><NA>No opening themes have been added to this title.</NA></p>
          )}
        </div>
        <div>
          <h2 className="section-h">Ending Theme</h2>
          {songs.filter((s) => s.kind === "Ending").length ? (
            songs
              .filter((s) => s.kind === "Ending")
              .map((s, i) => (
                <p key={s.title} className="small">
                  #{i + 1}: &quot;{s.title}&quot; by {s.artist}
                </p>
              ))
          ) : (
            <p className="small"><NA>No ending themes have been added to this title.</NA></p>
          )}
        </div>
      </div>

      <h2 className="section-h">
        Characters &amp; Voice Actors
        <Link href={`${base}/characters`} className="more">
          More characters
        </Link>
      </h2>
      {cast.length ? (
        <div>
          {cast.slice(0, 6).map((c) => (
            <div className="cast-row" key={c.characterId}>
              <div className="cast-cell">
                <Portrait name={c.character.name} id={c.characterId} />
                <div>
                  <Link href={characterUrl(c.character)}>{c.character.name}</Link>
                  <div className="role">{c.role}</div>
                </div>
              </div>
              <div className="cast-cell right">
                {c.voices.map((v) => (
                  <div key={v.personId}>
                    <Link href={personUrl(v.person)}>{v.person.name}</Link>
                    <div className="role">{v.language}</div>
                  </div>
                ))}
                {c.voices[0] && <Portrait name={c.voices[0].person.name} id={c.voices[0].personId} />}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p><NA>No characters or voice actors have been added to this title.</NA></p>
      )}

      <h2 className="section-h">
        Staff
        <Link href={`${base}/characters#staff`} className="more">
          More staff
        </Link>
      </h2>
      {staff.length ? (
        <table className="yal-table">
          <tbody>
            {staff.slice(0, 6).map((s) => (
              <tr key={s.personId + s.role}>
                <td>
                  <Link href={personUrl(s.person)}>{s.person.name}</Link>
                </td>
                <td className="muted">
                  {s.role}
                  {s.note && ` (${s.note})`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p><NA>No staff for this anime have been added to this title.</NA></p>
      )}

      <h2 className="section-h">
        Recently Updated Forum Discussions
        <Link href={`${base}/forum`} className="more">
          More discussions
        </Link>
      </h2>
      {threads.length ? (
        <table className="yal-table">
          <tbody>
            {threads.map((t) => (
              <tr key={t.thread.id}>
                <td>
                  <Link href={`/forum/thread/${t.thread.id}`}>{t.thread.title}</Link>
                  <span className="sub">by {t.thread.author}</span>
                </td>
                <td className="num">{fmtNum(t.snapshot && t.thread.origin === "archive" ? t.snapshot.replies : t.replies)} replies</td>
                <td className="muted small" style={{ whiteSpace: "nowrap" }}>
                  {t.last ? relativeTo(t.last.at, asOf) : formatDate(t.thread.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p><NA>No discussions yet.</NA></p>
      )}

      <h2 className="section-h">
        Reviews
        <Link href={`${base}/reviews`} className="more">
          More reviews
        </Link>
      </h2>
      {reviews.length ? reviews.map((r) => <ReviewView key={r.id} review={r} />) : <p><NA>No reviews have been submitted for this title.</NA></p>}

      {anime.archiveNotes?.map((n) => (
        <ArchiveNote key={n}>{n}</ArchiveNote>
      ))}
      {anime.provenance === "reconstructed" && (
        <ArchiveNote>This entry was written for the Lumine StarWorks archive, built around the documented facts about the production.</ArchiveNote>
      )}
    </>
  );
}
