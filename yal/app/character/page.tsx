import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle, SectionNav } from "@/components/SectionNav";
import { Portrait, fmtNum } from "@/components/ui";
import { animeUrl, characterAppearances, characterUrl, visibleCharacters } from "@/lib/catalog";
import { favoritesCount } from "@/lib/members";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Characters" };

export default async function CharacterIndex() {
  const { asOf } = await getViewer();
  const chars = visibleCharacters(asOf);
  const rows = await Promise.all(chars.map(async (c) => ({ c, fav: await favoritesCount("characters", c.id, asOf), apps: characterAppearances(c, asOf) })));
  rows.sort((a, b) => b.fav - a.fav || a.c.name.localeCompare(b.c.name));
  return (
    <>
      <Breadcrumb items={[{ label: "Anime", href: "/anime" }, { label: "Characters" }]} />
      <div className="page single">
        <main>
          <PageTitle title="Characters" attached />
          <SectionNav section="anime" active="/character" />
          <div className="box" style={{ borderTop: "none" }}>
            <table className="yal-table">
              <thead>
                <tr>
                  <th />
                  <th>Character</th>
                  <th>Animeography</th>
                  <th className="num">Favorites</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ c, fav, apps }) => (
                  <tr key={c.id}>
                    <td style={{ width: 52 }}>
                      <Portrait name={c.name} id={c.id} />
                    </td>
                    <td>
                      <Link href={characterUrl(c)}>
                        <b>{c.name}</b>
                      </Link>
                      <span className="sub">{c.role}</span>
                    </td>
                    <td>
                      {apps.map((a) => (
                        <div key={a.anime.id}>
                          <Link href={animeUrl(a.anime)}>{a.anime.title}</Link> <span className="muted">({a.role})</span>
                        </div>
                      ))}
                    </td>
                    <td className="num">{fmtNum(fav)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <div className="empty">No characters are in the database at this point in time.</div>}
          </div>
        </main>
      </div>
    </>
  );
}
