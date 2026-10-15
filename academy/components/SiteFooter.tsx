import Link from "next/link";
import { Logo } from "./Logo";

const SITE = "https://www.nurseswecare.org";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t-4 border-pink bg-surface-muted">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            A community of caring and learning. Occupational health and respiratory protection
            education, developed and delivered by Registered Nurses.
          </p>
          <p className="text-sm text-muted">702 Upper James St., Hamilton, ON L9C 2Z8</p>
        </div>
        <div>
          <h3 className="caps text-xs font-bold text-sky-deep">Learn</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li><Link href="/courses" className="hover:text-accent">All courses</Link></li>
            <li><Link href="/courses?category=Respiratory%20Protection" className="hover:text-accent">Respiratory protection</Link></li>
            <li><Link href="/courses?category=IEN%20Pathways" className="hover:text-accent">IEN pathways</Link></li>
            <li><Link href="/dashboard" className="hover:text-accent">My learning</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="caps text-xs font-bold text-sky-deep">NursesWeCare</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li><a href={SITE} className="hover:text-accent" target="_blank" rel="noreferrer">nurseswecare.org</a></li>
            <li><a href={`${SITE}/booking-workingplace-request-form`} className="hover:text-accent" target="_blank" rel="noreferrer">Book a fit test</a></li>
            <li><a href={`${SITE}/shop`} className="hover:text-accent" target="_blank" rel="noreferrer">Shop</a></li>
            <li><a href={`${SITE}/contact-5`} className="hover:text-accent" target="_blank" rel="noreferrer">Contact us</a></li>
          </ul>
        </div>
      </div>
      <div className="bg-sky">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-[#123f5e] sm:px-6">
          Prototype · Apart from the RN Train-the-Trainer program, courses, prices and learner data are sample placeholders.
        </p>
      </div>
    </footer>
  );
}
