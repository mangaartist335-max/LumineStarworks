import Link from "next/link";
import { Logo } from "@/components/Logo";

/** Simple readable layout for the Privacy Policy and Support pages. */
export function LegalShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" aria-label="BuildBrief home">
            <Logo wordmarkClassName="text-[15px]" />
          </Link>
          <nav className="flex gap-5 text-sm text-muted">
            <Link href="/support" className="hover:text-foreground">Support</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
        <div className="legal mt-8 space-y-6 text-[15px] leading-relaxed text-muted [&_a]:text-accent [&_a]:underline [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground [&_ul]:space-y-2">
          {children}
        </div>
      </main>
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} BuildBrief
      </footer>
    </div>
  );
}
