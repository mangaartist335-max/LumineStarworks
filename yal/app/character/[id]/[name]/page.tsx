import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ArchiveNote, NA, Portrait, fmtNum } from "@/components/ui";
import {
  allCharacters,
  animeUrl,
  characterAppearances,
  characterFacts,
  characterRelationships,
  characterUrl,
  getCharacter,
  personUrl,
} from "@/lib/catalog";
import { favoritesCount } from "@/lib/members";
import { boardThreads } from "@/lib/forum";
import { getViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/time";

export async function generateMetadata(props: PageProps<"/character/[id]/[name]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: allCharacters.find((c) => c.id === Number(id))?.name ?? "Character" };
}

export default async function CharacterPage(props: PageProps<"/character/[id]/[name]">) {
  const { id } = await props.params;
  const viewer = await getViewer();
  const { asOf } = viewer;
  const c = getCharacter(Number(id), asOf);
  if (!c) {
    const later = allCharacters.find((x) => x.id === Number(id));
    if (!later) notFound();
    return (
      <>
        <Breadcrumb items={[{ label: "Characters", href: "/character" }, { label: "Not in database yet" }]} />
        <div className="page single">
          <main>
            <div className="box">
              <div className="box-head">This character is not in the database yet</div>
              <div className="box-body">
                <p>This character has not been revealed at this point in time.</p>
                {later.visibleFrom && <p className="hint">The entry appears on {formatDate(later.visibleFrom)}.</p>}
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }
  const facts = characterFacts(c, asOf);
  const relationships = characterRelationships(c, asOf);
  const appearances = characterAppearances(c, asOf);
  const favorites = await favoritesCount("characters", c.id, asOf);
  const firstName = c.name.split(" ")[0];
  const discussions = (await boardThreads(null, asOf))
    .filter((t) => t.thread.title.toLowerCase().includes(firstName.toLowerCase()))
    .slice(0, 8);

  return (
    <>
      <Breadcrumb items={[{ label: "Characters", href: "/character" }, { label: c.name }]} />
      <div className="page left-side">
        <aside className="sidebar">
          <Portrait name={c.name} id={c.id} large />
          <div className="list-actions">
            <FavoriteButton account={viewer.account} kind="characters" id={c.id} back={characterUrl(c)} />
          </div>
          <div className="side-card">
            <div className="side-head">Animeography</div>
            <div className="side-body">
              <ul>
                {appearances.map((a) => (
                  <li key={a.anime.id}>
                    <Link href={animeUrl(a.anime)}>{a.anime.title}</Link> <span className="muted">({a.role})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="side-card">
            <div className="side-head">Member Favorites</div>
            <div className="side-body">{fmtNum(favorites)}</div>
          </div>
        </aside>
        <main>
          <div className="page-title">
            <h1>
              {c.name}
              {c.nativeName && <small>{c.nativeName}</small>}
            </h1>
            <div className="subtitle">{c.role}</div>
          </div>
          <div className="box">
            <div className="box-head">Biography</div>
            <div className="box-body">
              {facts.length ? facts.map((f) => <p key={f}>{f}</p>) : <p><NA>No biography yet.</NA></p>}
              {facts.length < c.bio.length && <ArchiveNote>More is revealed about {firstName} in episodes that have not aired at this point in time.</ArchiveNote>}
            </div>
          </div>

          <div className="box">
            <div className="box-head">Voice Actors</div>
            {appearances.flatMap((a) => a.voices).length ? (
              <table className="yal-table">
                <tbody>
                  {appearances.flatMap((a) =>
                    a.voices.map((v) => (
                      <tr key={`${a.anime.id}-${v.personId}`}>
                        <td style={{ width: 52 }}>
                          <Portrait name={v.person.name} id={v.personId} />
                        </td>
                        <td>
                          <Link href={personUrl(v.person)}>
                            <b>{v.person.name}</b>
                          </Link>
                          <span className="sub">{v.language}</span>
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            ) : (
              <div className="empty">No voice actors have been added.</div>
            )}
          </div>

          <div className="box">
            <div className="box-head">Relationships</div>
            {relationships.length ? (
              <table className="yal-table">
                <tbody>
                  {relationships.map((r) => (
                    <tr key={r.characterId}>
                      <td>
                        <Link href={characterUrl(r.character)}>{r.character.name}</Link>
                      </td>
                      <td className="muted">{r.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">No relationships documented yet.</div>
            )}
          </div>

          <div className="box">
            <div className="box-head">Discussions</div>
            {discussions.length ? (
              <table className="yal-table">
                <tbody>
                  {discussions.map((t) => (
                    <tr key={t.thread.id}>
                      <td>
                        <Link href={`/forum/thread/${t.thread.id}`}>{t.thread.title}</Link>
                      </td>
                      <td className="num">{fmtNum(t.archivedReplies ?? t.replies)} replies</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">
                No topics mention {firstName} yet. Try the{" "}
                <Link href="/forum/board/characters">Character Discussion</Link> board.
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
