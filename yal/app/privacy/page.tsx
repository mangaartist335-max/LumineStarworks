import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy">
      <p className="mt-0">
        Your email address is used only to sign in and is never shown on your profile. Passwords are stored as salted hashes, never in plain text.
      </p>
      <p>Your username, avatar, anime list, reviews and forum posts are public. Reports you send to the moderators are private.</p>
      <p>A session cookie keeps you logged in, and a second cookie remembers which archive date you are browsing.</p>
    </InfoPage>
  );
}
