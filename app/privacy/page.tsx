import type { Metadata } from "next";
import { LegalShell } from "@/components/marketing/LegalShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy — BuildBrief",
  description: "How BuildBrief collects, uses and protects your information.",
};

export default function PrivacyPage() {
  const email = SITE.supportEmail;
  return (
    <LegalShell title="Privacy Policy" subtitle={`Last updated ${SITE.policyUpdated}`}>
      <p>
        BuildBrief (&ldquo;we&rdquo;, &ldquo;us&rdquo;) helps you turn ideas into project plans and
        working app prototypes, on the web and in our iOS and Android apps. This policy explains what
        information we collect, why, and the choices you have. In short: we only use your information
        to run BuildBrief for you. We don&apos;t sell it, we don&apos;t show ads, and we don&apos;t
        track you across other apps or websites.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your email address, an optional display name, and your
          password (stored securely by our authentication provider; we never see it in plain text).
        </li>
        <li>
          <strong>Your projects:</strong> the ideas and details you type in, the plans
          (&ldquo;blueprints&rdquo;) and apps BuildBrief generates for you, your task checklist
          progress, and project settings such as name and status.
        </li>
        <li>
          <strong>Usage limits:</strong> a record of when you generate plans or build apps, so we can
          apply fair daily limits.
        </li>
        <li>
          <strong>Notifications (mobile app):</strong> if you allow notifications, a push token for
          your device, used only to tell you when a plan or app has finished.
        </li>
        <li>
          <strong>On your device:</strong> the mobile app keeps your sign-in session in your
          phone&apos;s secure storage, and saved copies of your projects and preferences (theme,
          sound, haptics) so it works offline. These stay on your device.
        </li>
      </ul>
      <p>
        We don&apos;t collect your location, contacts, photos, microphone or camera data, and we
        don&apos;t use advertising identifiers or analytics trackers.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To create and secure your account and keep you signed in.</li>
        <li>To generate, save and sync your plans and apps across your devices.</li>
        <li>To send the notifications you asked for, and account emails like password resets.</li>
        <li>To prevent abuse and keep the service running reliably (for example, daily limits).</li>
      </ul>

      <h2>Services that help us run BuildBrief</h2>
      <p>We share information only with providers that process it on our behalf:</p>
      <ul>
        <li>
          <strong>Supabase</strong>: account sign-in and database hosting for your account and
          projects.
        </li>
        <li>
          <strong>Vercel</strong>: hosting for the BuildBrief website and its servers.
        </li>
        <li>
          <strong>Anthropic (Claude)</strong>: the AI that writes your plans and builds your apps. The
          project details you enter are sent to Anthropic to generate results. Anthropic does not use
          this data to train its models under its commercial terms.
        </li>
        <li>
          <strong>Expo</strong>: delivers push notifications to the mobile app.
        </li>
      </ul>
      <p>
        We may also disclose information if required by law, or to protect the safety and rights of
        our users and BuildBrief.
      </p>

      <h2>Your projects stay yours</h2>
      <p>
        Your projects are private to your account. Database access rules make sure only you can read
        or change them. Apps you build run in a sealed-off viewer that can&apos;t access your account.
        If you share an exported file or a built app yourself, it&apos;s up to you who receives it.
      </p>

      <h2>Keeping and deleting your data</h2>
      <p>
        We keep your account and projects until you delete them. You can delete a project at any
        time, and you can permanently delete your whole account and everything in it from{" "}
        <strong>Settings → Delete account</strong> on the website or in the app. Deletion is
        immediate and can&apos;t be undone. Our providers may keep encrypted backups for a short
        period before they are overwritten.
      </p>

      <h2>Security</h2>
      <p>
        Data is sent over encrypted connections (HTTPS). AI and administrative keys are kept on our
        servers only, never in the apps. No system is perfectly secure, but we work to protect your
        information.
      </p>

      <h2>Children</h2>
      <p>
        BuildBrief is not directed to children under 13, and we don&apos;t knowingly collect
        information from them. If you believe a child has created an account, contact us and
        we&apos;ll delete it.
      </p>

      <h2>Your choices and rights</h2>
      <p>
        You can view and edit your projects and display name at any time, turn notifications off in
        your device or app settings, and delete your account in Settings. Depending on where you
        live, you may have additional rights to access, correct or delete your information; contact
        us to use them.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy, we&apos;ll update the date above, and for significant changes
        we&apos;ll let you know in the app or by email.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy?{" "}
        {email ? <a href={`mailto:${email}`}>{email}</a> : "Contact us through the BuildBrief Support page."}{" "}
        You can also visit our <a href="/support">Support page</a>.
      </p>
    </LegalShell>
  );
}
