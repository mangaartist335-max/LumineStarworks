import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <defs>
        <linearGradient id="lumine-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--star)" />
          <stop offset="100%" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#lumine-mark)" opacity="0.18" />
      <path d="M16 5.5 18.6 13.4 26.5 16 18.6 18.6 16 26.5 13.4 18.6 5.5 16 13.4 13.4Z" fill="url(#lumine-mark)" />
      <circle cx="24" cy="8" r="1.4" fill="var(--star)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}>
      <LogoMark className="transition-transform duration-500 group-hover:rotate-[24deg]" />
      <span className="flex flex-col leading-none">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Lumine StarWorks</span>
        <span className="text-sm font-bold tracking-tight">Anime Archive</span>
      </span>
    </Link>
  );
}
