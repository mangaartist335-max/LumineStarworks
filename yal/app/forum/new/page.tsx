import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { NewTopicForm } from "@/components/forum/NewTopicForm";
import { allBoards } from "@/lib/archive";
import { visibleAnime } from "@/lib/catalog";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "New Topic" };

export default async function NewTopicPage(props: PageProps<"/forum/new">) {
  const sp = await props.searchParams;
  const viewer = await getViewer();
  const board = (Array.isArray(sp.board) ? sp.board[0] : sp.board) ?? "general";
  if (!viewer.account) redirect(`/login?next=${encodeURIComponent(`/forum/new?board=${board}`)}`);
  const animeId = Number(Array.isArray(sp.anime) ? sp.anime[0] : sp.anime) || null;
  const boards = allBoards()
    .filter((b) => b.slug !== "episode")
    .map((b) => ({ slug: b.slug, name: b.name }));
  const anime = visibleAnime(viewer.asOf)
    .map((a) => ({ id: a.id, title: a.title }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <>
      <Breadcrumb items={[{ label: "Forums", href: "/forum" }, { label: "New Topic" }]} />
      <div className="page single">
        <main>
          <NewTopicForm boards={boards} board={boards.some((b) => b.slug === board) ? board : "general"} anime={anime} animeId={animeId} />
        </main>
      </div>
    </>
  );
}
