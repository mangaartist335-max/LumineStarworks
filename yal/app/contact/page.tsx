import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <InfoPage title="Contact">
      <p className="mt-0">
        Questions, bug reports and database corrections are best posted in <Link href="/forum/board/support">Community Support</Link>, where the staff
        and Database Contributors can help.
      </p>
      <p>To report a post, use the &quot;Report&quot; link under it.</p>
    </InfoPage>
  );
}
