import {
  Compass,
  GraduationCap,
  HeartPulse,
  House,
  Leaf,
  MessageCircleHeart,
  Sparkles,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import type { CourseIcon, CoverTheme } from "@/lib/courses";

const ICONS: Record<CourseIcon, LucideIcon> = {
  "heart-pulse": HeartPulse,
  leaf: Leaf,
  compass: Compass,
  users: Users,
  stethoscope: Stethoscope,
  sparkles: Sparkles,
  graduation: GraduationCap,
  home: House,
  message: MessageCircleHeart,
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
      <div className="cover-pattern absolute inset-0 opacity-70" />
      <div className="absolute -right-6 -bottom-8 h-32 w-32 rounded-full bg-white/15" />
      <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-white/10" />
      <div className="relative grid h-full w-full place-items-center">
        <span
          className={clsx(
            "grid place-items-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm",
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
