"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import { Award, BookOpenText, GraduationCap, Menu, ShieldPlus, X } from "lucide-react";
import clsx from "clsx";
import { Logo } from "./Logo";
import { learner } from "@/lib/learner";

const FIT_TEST_URL = "https://www.nurseswecare.org/booking-workingplace-request-form";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/courses/rn-respirator-fit-testing-train-the-trainer", label: "RN Train-the-Trainer Program" },
  { href: "/dashboard", label: "My Learning" },
];

const BAND = [
  { href: "/courses", icon: GraduationCap, title: "Academy", sub: "NursesWeCare Courses" },
  { href: FIT_TEST_URL, icon: ShieldPlus, title: "N95", sub: "Respirator Fit Test", external: true },
  { href: "/dashboard#certificates", icon: Award, title: "Certificates", sub: "Your Achievements" },
  { href: "/dashboard", icon: BookOpenText, title: "My Learning", sub: "Pick Up Where You Left Off" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/courses") return pathname === "/courses";
  return pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:flex-col lg:gap-4 lg:pb-3 lg:pt-6">
        <Logo />

        <nav className="hidden flex-wrap items-center justify-center lg:flex" aria-label="Main">
          {NAV.map((item, i) => (
            <Fragment key={item.href}>
              {i > 0 && <span className="mx-4 h-5 w-px bg-pink" aria-hidden />}
              <Link
                href={item.href}
                className={clsx(
                  "caps text-[15px] font-semibold transition",
                  isActive(pathname, item.href) ? "text-accent" : "text-sky-deep hover:text-brand"
                )}
              >
                {item.label}
              </Link>
            </Fragment>
          ))}
        </nav>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full text-sky-deep lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-t px-4 py-3 lg:hidden" aria-label="Mobile">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={clsx(
                "caps block rounded-lg px-3 py-3 text-xs font-semibold",
                isActive(pathname, item.href) ? "text-accent" : "text-sky-deep"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="bg-sky">
        <div className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-4 py-5 sm:px-6 lg:justify-between lg:py-6">
          {BAND.map(({ href, icon: Icon, title, sub, external }) => {
            const inner = (
              <>
                <Icon className="h-10 w-10 shrink-0 text-pink lg:h-12 lg:w-12" strokeWidth={1.4} aria-hidden />
                <span className="on-band leading-tight">
                  <span className="block font-display text-xl text-white lg:text-[28px]">{title}</span>
                  <span className="block font-display text-xs text-white/90 lg:text-sm">{sub}</span>
                </span>
              </>
            );
            const cls = "flex shrink-0 items-center gap-2.5 transition hover:opacity-85";
            return external ? (
              <a key={title} href={href} target="_blank" rel="noreferrer" className={cls}>
                {inner}
              </a>
            ) : (
              <Link key={title} href={href} className={cls}>
                {inner}
              </Link>
            );
          })}
          <Link
            href="/dashboard"
            className="hidden shrink-0 items-center gap-2 text-white lg:flex"
            aria-label={`${learner.fullName}'s learning`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white font-caps text-xs font-bold text-sky-deep">
              {learner.initials}
            </span>
            <span className="font-display text-base">Hi, {learner.firstName}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
