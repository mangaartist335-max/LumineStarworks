import type { Metadata } from "next";
import { LegalShell } from "@/components/marketing/LegalShell";
import { DAILY_APP_BUILD_LIMIT, DAILY_GENERATION_LIMIT } from "@/lib/generation-limit";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Support — BuildBrief",
  description: "Get help with BuildBrief on the web, iPhone and Android.",
};

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "How does BuildBrief work?",
    a: "Describe your idea in your own words. BuildBrief writes a plan (the main features, screens, how people use it, and a step-by-step build checklist), then one tap on Build App turns it into a working version you can try right away.",
  },
  {
    q: "Is it the same account on my phone and computer?",
    a: "Yes. Sign in with the same email on the website and in the app. Your projects, plans, built apps and checklist progress sync automatically.",
  },
  {
    q: "Are there limits?",
    a: `To keep things fair, each account can create up to ${DAILY_GENERATION_LIMIT} plans and ${DAILY_APP_BUILD_LIMIT} app builds every 24 hours. Your limit refreshes automatically.`,
  },
  {
    q: "A plan or app build didn't finish. What should I do?",
    a: "Tap Try again. Builds usually take a minute or two. If it keeps failing, try a shorter or simpler idea description.",
  },
  {
    q: "I forgot my password.",
    a: "Tap “Forgot password?” on the sign-in screen and we'll email you a link to choose a new one. Check your spam folder if it doesn't arrive.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Settings → Delete account (on the website or in the app). This permanently deletes your account and all of your projects.",
  },
  {
    q: "Can I use the apps BuildBrief builds?",
    a: "Yes. Built apps are yours: play them in BuildBrief, download them as a single file, or share them. They're prototypes made from your plan; use the AI coding prompt and files in each project to turn one into a full production app.",
  },
];

export default function SupportPage() {
  const email = SITE.supportEmail;
  return (
    <LegalShell title="Support" subtitle="We're happy to help.">
      <p>
        Need a hand with BuildBrief? Most answers are below. If you&apos;re still stuck, reach out and
        we&apos;ll get back to you as soon as we can.
      </p>
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="font-semibold text-foreground">Contact us</p>
        <p className="mt-1">
          {email ? (
            <>
              Email <a href={`mailto:${email}?subject=BuildBrief%20support`}>{email}</a>. Include the
              email you sign in with and a short description (screenshots help!).
            </>
          ) : (
            "Support email coming soon."
          )}
        </p>
      </div>

      <h2>Frequently asked questions</h2>
      <div className="space-y-5">
        {FAQ.map((item) => (
          <div key={item.q}>
            <p className="font-medium text-foreground">{item.q}</p>
            <p className="mt-1">{item.a}</p>
          </div>
        ))}
      </div>

      <h2>Privacy</h2>
      <p>
        Read how we handle your information in our <a href="/privacy">Privacy Policy</a>.
      </p>
    </LegalShell>
  );
}
