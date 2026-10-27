import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ListEntryForm } from "@/components/list/ListEntryForm";
import { removeListEntryAction } from "@/app/actions/list";
import { animeUrl, getAnime } from "@/lib/catalog";
import { getStore } from "@/lib/store";
import { getViewer } from "@/lib/viewer";
import { formatDateTime, happened } from "@/lib/time";

export const metadata: Metadata = { title: "Edit Anime List Entry" };

export default async function EditListEntryPage(props: PageProps<"/ownlist/anime/[id]/edit">) {
  const { id } = await props.params;
  const viewer = await getViewer();
  if (!viewer.account) redirect(`/login?next=${encodeURIComponent(`/ownlist/anime/${id}/edit`)}`);
  const anime = getAnime(Number(id), viewer.asOf);
  if (!anime) notFound();
  const entry = await getStore().getListEntry(viewer.account.id, anime.id);
  const joined = happened(viewer.account.joinedAt, viewer.asOf);

  return (
    <>
      <Breadcrumb items={[{ label: "My List", href: `/animelist/${encodeURIComponent(viewer.account.username)}` }, { label: anime.title, href: animeUrl(anime) }, { label: "Edit" }]} />
      <div className="page single">
        <main style={{ maxWidth: 720 }}>
          <div className="box">
            <div className="box-head">
              {entry ? "Edit" : "Add"}: <Link href={animeUrl(anime)}>{anime.title}</Link>
            </div>
            <div className="box-body">
              {!joined && (
                <div className="notice">
                  Your account joined YAL on {formatDateTime(viewer.account.joinedAt)}. Travel to a date after that to update your list.
                </div>
              )}
              <ListEntryForm animeId={anime.id} maxEpisodes={anime.episodesPlanned} entry={entry} />
              {entry && (
                <form action={removeListEntryAction} style={{ marginTop: 10, borderTop: "1px dotted #c5b397", paddingTop: 8 }}>
                  <input type="hidden" name="animeId" value={anime.id} />
                  <button type="submit" className="btn" style={{ color: "var(--mod)" }}>
                    Remove from list
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
