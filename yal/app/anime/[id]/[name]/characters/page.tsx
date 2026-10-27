import type { Metadata } from "next";
import Link from "next/link";
import { NA, Portrait } from "@/components/ui";
import { loadAnime } from "@/lib/anime-page";
import { animeCharacters, animeStaff, characterUrl, getAnimeAnyTime, personUrl } from "@/lib/catalog";

export async function generateMetadata(props: PageProps<"/anime/[id]/[name]/characters">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `${getAnimeAnyTime(Number(id))?.title ?? "Anime"} - Characters & Staff` };
}

export default async function AnimeCharacters(props: PageProps<"/anime/[id]/[name]/characters">) {
  const { id } = await props.params;
  const load = await loadAnime(id);
  if (load.state !== "ok") return null;
  const { anime, asOf } = load;
  const cast = animeCharacters(anime, asOf);
  const staff = animeStaff(anime, asOf);

  return (
    <>
      <h2 className="section-h">Characters &amp; Voice Actors</h2>
      {cast.length ? (
        cast.map((c) => (
          <div className="cast-row" key={c.characterId}>
            <div className="cast-cell">
              <Portrait name={c.character.name} id={c.characterId} />
              <div>
                <Link href={characterUrl(c.character)}>
                  <b>{c.character.name}</b>
                </Link>
                <div className="role">
                  {c.role} &middot; {c.character.role}
                </div>
              </div>
            </div>
            <div className="cast-cell right">
              {c.voices.length ? (
                c.voices.map((v) => (
                  <div key={v.personId} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div>
                      <Link href={personUrl(v.person)}>{v.person.name}</Link>
                      <div className="role">{v.language}</div>
                    </div>
                    <Portrait name={v.person.name} id={v.personId} />
                  </div>
                ))
              ) : (
                <NA>Voice actor not documented</NA>
              )}
            </div>
          </div>
        ))
      ) : (
        <p>
          <NA>No characters or voice actors have been added to this title.</NA>
        </p>
      )}

      <h2 className="section-h" id="staff">
        Staff
      </h2>
      {staff.length ? (
        <table className="yal-table">
          <tbody>
            {staff.map((s) => (
              <tr key={s.personId + s.role}>
                <td style={{ width: 52 }}>
                  <Portrait name={s.person.name} id={s.personId} />
                </td>
                <td>
                  <Link href={personUrl(s.person)}>
                    <b>{s.person.name}</b>
                  </Link>
                  <span className="sub">
                    {s.role}
                    {s.note && ` (${s.note})`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>
          <NA>No staff for this anime have been added to this title.</NA>
        </p>
      )}
    </>
  );
}
