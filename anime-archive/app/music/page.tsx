import type { Metadata } from "next";
import { PageHeader } from "@/components/archive/page-header";
import { MusicArchive } from "@/components/directory/music-archive";
import { getComposers, getMusicArchive } from "@/lib/archive/queries";
import { loadArchive } from "@/lib/archive/server";

export const metadata: Metadata = {
  title: "Music archive",
  description: "Soundtrack composers, original scores, opening and ending themes, insert songs, performers and soundtrack releases.",
};

export default async function MusicPage({ searchParams }: PageProps<"/music">) {
  const { q } = await searchParams;
  const index = await loadArchive();
  const tracks = getMusicArchive(index);
  const composers = getComposers(index);
  return (
    <>
      <PageHeader
        eyebrow="Music archive"
        title="Themes, scores & soundtracks"
        description="Search by composer, singer, production, year or song — openings, endings, insert songs and original soundtrack releases."
      />
      <div className="container-page py-10">
        <MusicArchive tracks={tracks} composers={composers} initialQuery={typeof q === "string" ? q : ""} />
      </div>
    </>
  );
}
