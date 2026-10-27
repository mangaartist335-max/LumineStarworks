import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <InfoPage title="About YourAnimeList">
      <p className="mt-0">
        YourAnimeList (YAL) is a fan-run anime and manga database and community. Members keep track of what they watch, score and review
        shows, and talk about every new episode together.
      </p>
      <p>
        The database is edited by volunteer Database Contributors, and episode threads are opened automatically by YALBot after each Japanese
        broadcast.
      </p>
      <p>
        This copy of the site is part of the Lumine StarWorks internet archive. <Link href="/timemachine">Read how the archive works</Link>.
      </p>
    </InfoPage>
  );
}
