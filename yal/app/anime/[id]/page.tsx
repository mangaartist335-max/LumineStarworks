import { notFound, redirect } from "next/navigation";
import { animeUrl, getAnimeAnyTime } from "@/lib/catalog";

/** /anime/19815 → /anime/19815/Impact_of_Eden */
export default async function AnimeIdRedirect(props: PageProps<"/anime/[id]">) {
  const { id } = await props.params;
  const a = getAnimeAnyTime(Number(id));
  if (!a) notFound();
  redirect(animeUrl(a));
}
