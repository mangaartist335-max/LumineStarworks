import {
  Bandage,
  ClipboardCheck,
  Globe,
  HeartPulse,
  House,
  Leaf,
  ShieldCheck,
  Users,
  Wind,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import type { CourseIcon, CoverTheme } from "@/lib/courses";

const ICONS: Record<CourseIcon, LucideIcon> = {
  shield: ShieldCheck,
  wind: Wind,
  "heart-pulse": HeartPulse,
  bandage: Bandage,
  globe: Globe,
  users: Users,
  clipboard: ClipboardCheck,
  home: House,
  leaf: Leaf,
};

export function CourseCover({
  theme,
  icon,
  size = "md",
  className,
}: {
  theme: CoverTheme;
  icon: CourseIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = ICONS[icon];
  return (
    <div className={clsx(`cover-${theme}`, "relative overflow-hidden", className)}>
      <div className="dot-grid absolute inset-0 opacity-80" />
      <div className="absolute -right-8 -bottom-10 h-36 w-36 rounded-full bg-white/30 blur-sm" />
      <div className="absolute -left-10 -top-12 h-32 w-32 rounded-full bg-white/20" />
      <div className="relative grid h-full w-full place-items-center">
        <span
          className={clsx(
            "grid place-items-center rounded-2xl bg-white/35 text-white shadow-[0_8px_24px_-10px_rgba(21,49,74,0.45)] ring-1 ring-white/70 backdrop-blur-sm",
            size === "sm" && "h-10 w-10",
            size === "md" && "h-14 w-14",
            size === "lg" && "h-20 w-20"
          )}
        >
          <Icon
            className={clsx(size === "sm" ? "h-5 w-5" : size === "md" ? "h-7 w-7" : "h-10 w-10")}
            aria-hidden
          />
        </span>
      </div>
    </div>
  );
}
