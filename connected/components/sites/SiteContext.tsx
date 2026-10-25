"use client";

// What a website rendered inside the browser can do: read its address,
// navigate (in place or in a new tab), set the tab title and show a link's
// address in the status bubble.

import { createContext, useContext, useEffect } from "react";
import type { WebUrl } from "@/lib/web/url";

export interface SiteContextValue {
  url: WebUrl;
  tabId: string;
  active: boolean;
  navigate: (href: string, opts?: { newTab?: boolean; replace?: boolean }) => void;
  setTitle: (title: string) => void;
  setStatus: (text: string | null) => void;
}

export const SiteCtx = createContext<SiteContextValue | null>(null);

export function useSite(): SiteContextValue {
  const s = useContext(SiteCtx);
  if (!s) throw new Error("useSite outside a browser tab");
  return s;
}

/** Sets the tab title while the page is shown. */
export function usePageTitle(title: string) {
  const { setTitle } = useSite();
  useEffect(() => setTitle(title), [title, setTitle]);
}

/** A link inside an archive website. Ctrl/middle-click opens a background tab. */
export function A({ href, children, className, title, ...rest }: { href: string; children: React.ReactNode; className?: string; title?: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">) {
  const { navigate, setStatus } = useSite();
  return (
    <a
      {...rest}
      href={href}
      className={className}
      title={title}
      onClick={(e) => {
        e.preventDefault();
        navigate(href, { newTab: e.ctrlKey || e.metaKey || e.shiftKey });
      }}
      onAuxClick={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          navigate(href, { newTab: true });
        }
      }}
      onMouseEnter={() => setStatus(href)}
      onMouseLeave={() => setStatus(null)}
      onFocus={() => setStatus(href)}
      onBlur={() => setStatus(null)}
    >
      {children}
    </a>
  );
}
