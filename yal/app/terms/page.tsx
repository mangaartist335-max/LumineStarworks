import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <InfoPage title="Terms of Use">
      <ol className="bb-list">
        <li>Be respectful to other members. Disagree with opinions, not people.</li>
        <li>No spoilers for future episodes in episode threads. Source material goes in spoiler tags.</li>
        <li>No links to unlicensed streams or downloads.</li>
        <li>One account per person. Usernames that impersonate others may be changed.</li>
        <li>Moderators may edit or remove posts that break these rules.</li>
      </ol>
    </InfoPage>
  );
}
