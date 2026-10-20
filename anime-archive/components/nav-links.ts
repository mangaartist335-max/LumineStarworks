import { CalendarRange, Disc3, Film, Library, Network, Search, Users } from "lucide-react";

export const NAV_LINKS = [
  { href: "/seasons", label: "Seasons", icon: CalendarRange },
  { href: "/anime", label: "Browse", icon: Library },
  { href: "/franchises", label: "Franchises", icon: Network },
  { href: "/studios", label: "Studios", icon: Film },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/music", label: "Music", icon: Disc3 },
] as const;

export const SEARCH_LINK = { href: "/search", label: "Search", icon: Search } as const;
