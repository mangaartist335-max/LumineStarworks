import Link from "next/link";
import { HeartHandshake } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-sm transition group-hover:bg-brand-dark">
        <HeartHandshake className="h-5 w-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[17px] font-semibold text-foreground">
          NursesWeCare
        </span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          Academy
        </span>
      </span>
    </Link>
  );
}
