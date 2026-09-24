import {
  ArrowRight,
  Blocks,
  Boxes,
  Database,
  FileCode2,
  Gamepad2,
  LayoutGrid,
  ListChecks,
  Map,
  Rocket,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";

const GENERATES = [
  { icon: Sparkles, label: "Project Overview & MVP Definition" },
  { icon: ListChecks, label: "Core Features vs. Later Features" },
  { icon: LayoutGrid, label: "Screens, User Flow & UI Checklist" },
  { icon: Wrench, label: "Suggested Tech Stack" },
  { icon: Database, label: "Database Plan & Schema" },
  { icon: Boxes, label: "Project & Folder Structure" },
  { icon: Map, label: "48-Hour Development Plan" },
  { icon: Terminal, label: "Claude Code Build Prompt" },
  { icon: FileCode2, label: "CLAUDE.md & AGENTS.md" },
];

const STEPS = [
  {
    title: "Describe your idea",
    body: "Tell BuildBrief what you want to build in plain language — an app, a game, a SaaS, anything.",
  },
  {
    title: "Claude builds the blueprint",
    body: "In under a minute you get an MVP scope, screens, tech stack, database plan, and a 48-hour build plan.",
  },
  {
    title: "Ship it with an AI coding agent",
    body: "Copy the ready-made Claude Code prompt, CLAUDE.md, and AGENTS.md and start building immediately.",
  },
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
        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-20 text-center">
          <div className="animate-fade-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            From idea to AI-ready build plan
          </div>
          <h1 className="animate-fade-up text-4xl font-semibold tracking-tight text-gradient sm:text-6xl [animation-delay:80ms]">
            Turn an idea into something you can actually build.
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-balance text-lg text-muted [animation-delay:150ms]">
            BuildBrief transforms a rough app, website, SaaS, or game idea
            into a structured technical plan — MVP scope, screens, tech
            stack, database, and a 48-hour build plan — ready to hand to an
            AI coding agent like Claude Code.
          </p>
          <div className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row [animation-delay:220ms]">
            <ButtonLink href="/auth/sign-up" size="lg">
              Create a BuildBrief
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary" size="lg">
              See how it works
            </ButtonLink>
          </div>
        </div>

        {/* Idea -> blueprint visual */}
        <div className="relative mx-auto max-w-4xl px-6 pb-24">
          <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1.3fr]">
            <div className="animate-fade-up rounded-xl border border-border bg-surface p-5 text-left shadow-xl [animation-delay:280ms]">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your idea
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                &ldquo;I want to build a dinosaur endless runner with
                unlockable skins, mobile controls, leaderboards, and a
                shop.&rdquo;
              </p>
            </div>

            <ArrowRight className="mx-auto hidden h-5 w-5 rotate-90 text-muted-foreground md:block md:rotate-0" />

            <div className="animate-fade-up rounded-xl border border-border bg-surface p-5 text-left shadow-xl [animation-delay:340ms]">
              <div className="mb-3 flex items-center gap-2">
                <Logo wordmarkClassName="text-xs" />
                <span className="text-xs text-muted-foreground">
                  Structured BuildBrief
                </span>
              </div>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted">
                {[
                  "MVP Features",
                  "Screens & Flow",
                  "Tech Stack",
                  "Database Schema",
                  "48h Build Plan",
                  "Claude Prompt",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
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
            Three steps between a rough idea and a plan you can build from.
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

      {/* What BuildBrief generates */}
      <section id="generates" className="border-b border-border py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            What BuildBrief generates
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted">
            One idea in, a complete build-ready document out.
          </p>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GENERATES.map(({ icon: Icon, label }) => (
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
        </div>
      </section>

      {/* Built for AI-assisted development */}
      <section id="ai-native" className="border-b border-border py-24">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 md:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              <Terminal className="h-3.5 w-3.5 text-accent" />
              Built for AI-assisted development
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Every brief ships with a real Claude Code prompt.
            </h2>
            <p className="mt-4 text-muted leading-relaxed">
              No re-explaining your idea to an AI coding agent. Every
              BuildBrief includes a self-contained build prompt plus a
              CLAUDE.md and AGENTS.md tailored to your project, so a coding
              agent can start shipping immediately.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-2.5">
                <Blocks className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Copy the full prompt with one click and paste it into Claude
                Code.
              </li>
              <li className="flex items-start gap-2.5">
                <Rocket className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Download CLAUDE.md and AGENTS.md straight into your repo.
              </li>
              <li className="flex items-start gap-2.5">
                <Gamepad2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Works for web apps, SaaS, games, mobile apps, and dev tools.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 font-mono text-xs leading-relaxed text-muted shadow-xl">
            <div className="mb-3 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              <span className="ml-2 text-muted-foreground">
                claude-code-prompt.txt
              </span>
            </div>
            <p className="text-foreground">
              Build &ldquo;DinoRun&rdquo;, a dinosaur endless runner...
            </p>
            <p className="mt-2">
              MVP: procedural obstacle spawner, jump/duck controls, run
              distance scoring, local leaderboard, 3 unlockable skins...
            </p>
            <p className="mt-2">
              Stack: Next.js + Canvas renderer, Supabase for
              leaderboard/skins, Tailwind for the shop UI...
            </p>
            <p className="mt-2 text-muted-foreground">
              [ full brief context continues — no follow-up questions
              needed ]
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-radial-glow py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Stop staring at a blank prompt.
          </h2>
          <p className="mt-3 text-muted">
            Describe your idea and get a build-ready blueprint in minutes.
          </p>
          <div className="mt-8">
            <ButtonLink href="/auth/sign-up" size="lg">
              Create a BuildBrief
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <Logo wordmarkClassName="text-sm text-muted" />
          <p>&copy; {new Date().getFullYear()} BuildBrief. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
