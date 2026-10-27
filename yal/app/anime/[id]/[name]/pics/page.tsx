import type { Metadata } from "next";
import { NA } from "@/components/ui";
import { loadAnime } from "@/lib/anime-page";
import { getAnimeAnyTime } from "@/lib/catalog";

export async function generateMetadata(props: PageProps<"/anime/[id]/[name]/pics">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `${getAnimeAnyTime(Number(id))?.title ?? "Anime"} - Pictures` };
}

export default async function AnimePictures(props: PageProps<"/anime/[id]/[name]/pics">) {
  const { id } = await props.params;
  const load = await loadAnime(id);
  if (load.state !== "ok") return null;
  const { anime } = load;
  return (
    <>
      <h2 className="section-h">Pictures</h2>
      {anime.cover ? (
        <figure style={{ margin: 0, maxWidth: 520 }}>
          <div className="cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={anime.cover} alt={`${anime.title} title logo`} />
          </div>
          <figcaption className="hint" style={{ marginTop: 4 }}>
            {anime.title} title logo (エデンの衝撃)
          </figcaption>
        </figure>
      ) : (
        <p>
          <NA>No pictures have been added to this title.</NA>
        </p>
      )}
    </>
  );
}
