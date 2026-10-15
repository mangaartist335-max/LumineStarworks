import Link from "next/link";
import { MapPin } from "lucide-react";
import { Logo } from "./Logo";

const SITE = "https://www.nurseswecare.org";

export function SiteFooter() {
  return (
    <footer className="mt-28">
      <div className="gradient-fill h-1" />
      <div className="bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              Respiratory protection and occupational health learning for nurses and healthcare
              teams, taught by Registered Nurses.
            </p>
            <p className="flex items-center gap-2 text-sm text-muted">
              <MapPin className="h-4 w-4 text-accent" aria-hidden /> Hamilton, Ontario
            </p>
          </div>
          <FooterCol title="Learn">
            <li><Link href="/courses" className="hover:text-accent">All courses</Link></li>
            <li><Link href="/#paths" className="hover:text-accent">Learning paths</Link></li>
            <li><Link href="/courses/rn-respirator-fit-testing-train-the-trainer" className="hover:text-accent">Train-the-Trainer</Link></li>
          </FooterCol>
          <FooterCol title="You">
            <li><Link href="/dashboard" className="hover:text-accent">My learning</Link></li>
            <li><Link href="/dashboard#certificates" className="hover:text-accent">Certificates</Link></li>
          </FooterCol>
          <FooterCol title="NursesWeCare">
            <li><a href={SITE} className="hover:text-accent" target="_blank" rel="noreferrer">Main website</a></li>
            <li><a href={`${SITE}/booking-workingplace-request-form`} className="hover:text-accent" target="_blank" rel="noreferrer">Book a fit test</a></li>
            <li><a href={`${SITE}/contact-5`} className="hover:text-accent" target="_blank" rel="noreferrer">Contact</a></li>
          </FooterCol>
        </div>
        <div className="border-t">
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
            Prototype · Apart from the RN Train-the-Trainer program, courses, prices and learner
            data are sample placeholders.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm text-muted">{children}</ul>
    </div>
  );
}
