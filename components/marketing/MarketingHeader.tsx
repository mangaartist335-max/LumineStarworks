import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";

export function MarketingHeader({ isAuthed }: { isAuthed: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <Logo wordmarkClassName="text-[15px]" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How it works
          </a>
          <a href="#you-get" className="hover:text-foreground transition-colors">
            What you get
          </a>
        </nav>
        <div className="flex items-center gap-3">
          {isAuthed ? (
            <ButtonLink href="/dashboard" size="sm">
              Go to dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/auth/sign-in" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Sign in
              </ButtonLink>
              <ButtonLink href="/auth/sign-up" size="sm">
                Make my app
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
