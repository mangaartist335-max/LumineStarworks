import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-surface-muted/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            The learning home of NursesWeCare. Courses made by nurses, for nurses, so the people
            who care for everyone else have a place to grow, too.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Learn</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/courses" className="hover:text-foreground">All courses</Link></li>
            <li><Link href="/courses?category=Nurse%20Wellbeing" className="hover:text-foreground">Wellbeing</Link></li>
            <li><Link href="/courses?category=Leadership" className="hover:text-foreground">Leadership</Link></li>
            <li><Link href="/dashboard" className="hover:text-foreground">My learning</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">NursesWeCare</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <a href="https://www.nurseswecare.org/" className="hover:text-foreground" target="_blank" rel="noreferrer">
                Visit nurseswecare.org
              </a>
            </li>
            <li><span>Membership</span></li>
            <li><span>Contact us</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
          Prototype · Course content, instructors and learner data are sample placeholders.
        </p>
      </div>
    </footer>
  );
}
