import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("h-5 w-5", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bb-logo-grad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-violet)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#bb-logo-grad)" />
      <path
        d="M10 21V11h5.2c2 0 3.4 1.1 3.4 2.9 0 1.2-.6 2-1.6 2.4 1.2.4 2 1.4 2 2.8 0 2-1.5 3-3.6 3H10Zm2.6-2.1h2.5c1 0 1.5-.4 1.5-1.2s-.5-1.2-1.5-1.2h-2.5v2.4Zm0-4.4h2.2c.9 0 1.4-.4 1.4-1.1s-.5-1.1-1.4-1.1h-2.2v2.2Z"
        fill="white"
      />
    </svg>
  );
}

export function Logo({
  className,
  wordmarkClassName,
}: {
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className={cn("font-semibold tracking-tight", wordmarkClassName)}>
        BuildBrief
      </span>
    </span>
  );
}
