import Link from "next/link";
import clsx from "clsx";

// A drawn take on the NursesWeCare mark: a heartbeat line running through a
// ring that curves into a stethoscope, with the stacked wordmark beside it.
export function LogoMark({ className, tone = "blue" }: { className?: string; tone?: "blue" | "white" }) {
  const stroke = tone === "white" ? "#ffffff" : "var(--sky-deep)";
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden fill="none">
      <path
        d="M38 70 A34 34 0 1 1 92 74"
        stroke={stroke}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M92 74 Q86 88 78 90"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="74" cy="91" r="6" stroke={stroke} strokeWidth="4" />
      <path
        d="M4 48 H34 L40 40 L46 56 L52 18 L58 74 L64 30 L70 52 L74 44 L78 48 H116"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ tone = "blue", size = "md" }: { tone?: "blue" | "white"; size?: "md" | "lg" }) {
  const text = tone === "white" ? "text-white" : "text-sky-deep";
  return (
    <Link href="/" className="group inline-flex items-center gap-2" aria-label="NursesWeCare Academy home">
      <LogoMark tone={tone} className={clsx(size === "lg" ? "h-20 w-24" : "h-14 w-[4.5rem]", "transition group-hover:scale-105")} />
      <span className={clsx("leading-none", text)}>
        <span
          className={clsx(
            "block font-caps font-extrabold tracking-wide",
            size === "lg" ? "text-3xl" : "text-[22px]"
          )}
        >
          NURSES
        </span>
        <span className={clsx("mt-0.5 block font-caps font-bold tracking-[0.55em]", size === "lg" ? "text-xs" : "text-[10px]")}>
          WE CARE
        </span>
        <span className="mt-1 block font-display text-[11px] italic tracking-normal text-accent">Academy</span>
      </span>
    </Link>
  );
}
