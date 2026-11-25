import {
  ArrowRight,
  Code2,
  Download,
  Gamepad2,
  ListChecks,
  Smartphone,
  Sparkles,
  Volume2,
  Wand2,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";

const YOU_GET = [
  { icon: Gamepad2, label: "A working app or game you can play" },
  { icon: Wand2, label: "Your features, built for real" },
  { icon: Smartphone, label: "Phone and desktop preview" },
  { icon: Volume2, label: "Sound effects built in" },
  { icon: Download, label: "Download it and share it" },
  { icon: ListChecks, label: "A clear plan of your idea" },
];

const STEPS = [
  {
    title: "Describe your idea",
    body: "Tell BuildBrief what you want in plain words: an app, a website, a game, anything. No tech knowledge needed.",
  },
  {
    title: "Get your plan",
    body: "In about a minute you get the main features, the screens, and how people will use it, all laid out clearly.",
  },
  {
    title: "Hit Build and play",
    body: "One click turns your plan into a working app with sound, right in your browser. Rebuild for a fresh take any time.",
  },
];

const BUBBLES = [
  { left: "12%", top: "62%", size: 34, color: "#f472b6" },
  { left: "38%", top: "40%", size: 46, color: "#60a5fa" },
  { left: "66%", top: "58%", size: 30, color: "#34d399" },
  { left: "56%", top: "22%", size: 38, color: "#fbbf24" },
  { left: "20%", top: "26%", size: 26, color: "#a78bfa" },
  { left: "74%", top: "34%", size: 22, color: "#f87171" },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader isAuthed={!!user} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-radial-glow">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_20%,transparent_80%)]" />
        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-16 text-center">
          <div className="animate-fade-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Describe it. Play it.
          </div>
          <h1 className="animate-fade-up text-4xl font-semibold tracking-tight text-gradient sm:text-6xl [animation-delay:80ms]">
            Turn your idea into a real app.
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-balance text-lg text-muted [animation-delay:150ms]">
            Describe an app, website or game in your own words. BuildBrief
            plans it out and builds a working version you can play with,
            share and download, in minutes.
          </p>
          <div className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row [animation-delay:220ms]">
            <ButtonLink href="/auth/sign-up" size="lg">
              Make my app
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary" size="lg">
              See how it works
            </ButtonLink>
          </div>
        </div>

        {/* Idea -> app visual */}
        <div className="relative mx-auto max-w-4xl px-6 pb-24">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            <div className="animate-fade-up rounded-xl border border-border bg-surface p-5 text-left shadow-xl [animation-delay:280ms]">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your idea
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                &ldquo;A relaxing game where colourful bubbles float up and
                you pop them for points. Golden bubbles give bonus points,
                and it gets a little faster over time.&rdquo;
              </p>
            </div>

            <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-muted-foreground md:rotate-0" />

            <div className="animate-fade-up mx-auto w-full max-w-[240px] [animation-delay:340ms]">
              <div className="rounded-[2rem] border-[6px] border-neutral-800 bg-gradient-to-b from-sky-200 to-indigo-200 shadow-2xl">
                <div className="relative aspect-[9/16] overflow-hidden rounded-[1.6rem]">
                  <div className="flex items-center justify-between px-4 pt-4 text-[11px] font-semibold text-indigo-900">
                    <span>Bubble Pop</span>
                    <span>⭐ 1,240</span>
                  </div>
                  {BUBBLES.map((b, i) => (
                    <span
                      key={i}
                      className="absolute rounded-full shadow-inner"
                      style={{
                        left: b.left,
                        top: b.top,
                        width: b.size,
                        height: b.size,
                        background: `radial-gradient(circle at 30% 30%, white, ${b.color} 55%)`,
                        opacity: 0.9,
                      }}
                    />
                  ))}
                  <div className="absolute inset-x-4 bottom-4 rounded-full bg-white/80 py-1.5 text-center text-[11px] font-semibold text-indigo-900">
                    Tap to pop! 🫧
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Your app, ready to play
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-b border-border py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted">
            Three steps from &ldquo;what if&hellip;&rdquo; to something you can actually use.
          </p>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-border-strong bg-surface text-sm font-semibold text-accent">
                  {i + 1}
                </div>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section id="you-get" className="border-b border-border py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            What you get
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted">
            One idea in, a working app out.
          </p>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {YOU_GET.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3.5 transition-colors hover:border-border-strong"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background-elevated text-accent">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-foreground">{label}</span>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-10 flex max-w-xl items-start justify-center gap-2 text-center text-sm text-muted-foreground">
            <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            Are you a developer? Every project also includes a full technical
            plan and ready-made files for AI coding tools, tucked away until
            you need them.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-radial-glow py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Your next idea deserves to exist.
          </h2>
          <p className="mt-3 text-muted">
            Describe it, and be playing with it in a few minutes.
          </p>
          <div className="mt-8">
            <ButtonLink href="/auth/sign-up" size="lg">
              Make my app
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <Logo wordmarkClassName="text-sm text-muted" />
          <nav className="flex gap-5">
            <a href="/support" className="hover:text-foreground">Support</a>
            <a href="/privacy" className="hover:text-foreground">Privacy</a>
          </nav>
          <p>&copy; {new Date().getFullYear()} BuildBrief. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
