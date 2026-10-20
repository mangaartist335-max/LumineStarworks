"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { NAV_LINKS, SEARCH_LINK } from "./nav-links";

export function MobileNav({ editorHref, editorLabel }: { editorHref: string; editorLabel: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle className="sr-only">Archive navigation</SheetTitle>
        <Logo />
        <nav aria-label="Mobile" className="mt-4 flex flex-col gap-1">
          {[...NAV_LINKS, SEARCH_LINK].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
                pathname.startsWith(href) && "bg-accent text-accent-foreground",
              )}
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <Button asChild variant="outline" className="w-full">
            <Link href={editorHref} onClick={() => setOpen(false)}>
              {editorLabel}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
