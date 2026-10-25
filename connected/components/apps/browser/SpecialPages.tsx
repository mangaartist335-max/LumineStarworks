"use client";

import { useEffect } from "react";
import { useSite, usePageTitle } from "@/components/sites/SiteContext";
import { searchUrl } from "@/lib/web/url";

/**
 * A website that isn't part of the Connected Era archive. It can only be
 * today's live version, so it opens in the real browser, clearly labelled,
 * instead of pretending to be a 2012-2013 page.
 */
export function LivePage() {
  const { url, navigate } = useSite();
  usePageTitle(`${url.host} (live website)`);
  return (
    <div className="special-page">
      <h1>This is a live website, not part of the archive</h1>
      <p>
        <b>{url.host}</b> isn&apos;t in the Connected Era&apos;s 2012-2013 web archive. Any copy shown here would be today&apos;s live site, not how it looked back then, so the Connected browser won&apos;t show it inside the archive.
      </p>
      <div className="special-actions">
        <button className="btn primary" onClick={() => window.open(url.href, "_blank", "noopener,noreferrer")}>
          Open today&apos;s live site in your real browser
        </button>
        <button className="btn" onClick={() => navigate(searchUrl(url.host.split(".")[0]))}>
          Search the archive instead
        </button>
      </div>
      <p className="muted">The live site opens in a new tab of the browser you&apos;re using right now, outside the Connected Desktop.</p>
    </div>
  );
}

export function NotFoundPage({ url, navigate, setTitle }: { url: string; navigate: (href: string) => void; setTitle: (t: string) => void }) {
  useEffect(() => setTitle("Address not understood"), [setTitle]);
  return (
    <div className="special-page">
      <h1>The browser can&apos;t open this address</h1>
      <p>
        <code>{url}</code> isn&apos;t a web address the browser understands. Only <code>http://</code>, <code>https://</code> and <code>about:</code> addresses can be opened.
      </p>
      <button className="btn" onClick={() => navigate(searchUrl(url))}>
        Search Goggle for it
      </button>
    </div>
  );
}
