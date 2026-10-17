import Link from "next/link";
import clsx from "clsx";

// Academy mark: two overlapping circles in sky and pink (care meeting
// learning) with a white plus where they meet.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 40" className={className} aria-hidden>
      <circle cx="17" cy="20" r="15" fill="var(--sky)" />
      <circle cx="31" cy="20" r="15" fill="var(--pink)" fillOpacity="0.9" />
      <path d="M24 13v14M17 20h14" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link href="/" className={clsx("group inline-flex items-center gap-2.5", className)} aria-label="NursesWeCare Academy home">
      <LogoMark className="h-9 w-11 transition group-hover:scale-105" />
      <span className="leading-none">
        <span
          className={clsx(
            "block font-display text-[17px] font-semibold tracking-tight transition-colors",
            tone === "light" ? "text-white" : "text-foreground"
          )}
        >
          NursesWeCare
        </span>
        <span
          className={clsx(
            "mt-0.5 block font-display text-[13px] font-semibold tracking-wide",
            tone === "light" ? "gradient-text-light" : "gradient-text"
          )}
        >
          Academy
        </span>
      </span>
    </Link>
  );
}
