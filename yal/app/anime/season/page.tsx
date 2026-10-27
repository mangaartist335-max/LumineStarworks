import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { seasonOf } from "@/lib/time";

export default async function CurrentSeason() {
  const { asOf } = await getViewer();
  const s = seasonOf(asOf);
  redirect(`/anime/season/${s.year}/${s.season}`);
}
