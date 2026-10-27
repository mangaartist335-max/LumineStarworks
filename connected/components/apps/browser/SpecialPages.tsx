"use client";

import { useEffect, useState } from "react";
import { useSite, usePageTitle } from "@/components/sites/SiteContext";
import { useClock, useSystem } from "@/components/system/system";
import { formatDate, fromInputs, toDateInput } from "@/lib/time";
import { searchUrl } from "@/lib/web/url";
import { isInternetArchiveHost, WAYBACK_EARLIEST, waybackUrl } from "@/lib/web/wayback";

/** A link saved under one of the archive's old addresses: send it to the current one. */
export function MovedPage({ to }: { to: string }) {
  const { navigate } = useSite();
  usePageTitle("Moved");
  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);
  return (
    <div className="special-page">
      <h1>This site has moved</h1>
      <p>
        Taking you to <code>{to}</code>...
      </p>
    </div>
  );
}

/** An archive address (something.connectedera.local) that no site answers to. */
export function NoSuchSitePage() {
  const { url, navigate } = useSite();
  usePageTitle("Server not found");
  return (
    <div className="special-page">
      <h1>Server not found</h1>
      <p>
        There&apos;s no website at <b>{url.host}</b> in the Connected Era archive. Check the address for typos, or search for what you&apos;re looking for.
      </p>
      <div className="special-actions">
        <button className="btn primary" onClick={() => navigate(searchUrl(url.host.split(".")[0]))}>
          Search Connected Search
        </button>
      </div>
    </div>
  );
}

const openOutside = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

/**
 * A website that isn't part of the Connected Era archive. It opens in the
 * real browser, clearly labelled, instead of pretending to be a 2012-2013
 * page: either today's live site, or the Internet Archive's Wayback Machine
 * capture closest to the computer's date (or an earlier date you pick).
 */
export function LivePage() {
  const { url, navigate } = useSite();
  const { computer } = useSystem();
  const t = useClock(60_000);
  const [picked, setPicked] = useState<string | null>(null);
  usePageTitle(`${url.host} (live website)`);

  const today = toDateInput(t, computer.timeZone);
  const date = picked ?? today;
  const pickedTime = date >= WAYBACK_EARLIEST && date <= today ? fromInputs(date, "12:00", computer.timeZone) : null;

  return (
    <div className="special-page">
      <h1>This is a live website, not part of the archive</h1>
      <p>
        <b>{url.host}</b> isn&apos;t in the Connected Era&apos;s 2012-2013 web archive. Showing it in here would mix today&apos;s internet into the archive, so the Connected browser opens real websites in your real browser instead.
      </p>
      {!isInternetArchiveHost(url.host) && (
        <>
          <h2 className="wayback-heading">See how it looked back then</h2>
          <p>
            The Internet Archive&apos;s Wayback Machine has been saving copies of websites since 1996. It can show you <b>{url.host}</b> as it was captured closest to the date you choose.
          </p>
          <div className="special-actions">
            <button className="btn primary" onClick={() => openOutside(waybackUrl(url.href, t))}>
              See it around {formatDate(t, computer.timeZone)} on the Wayback Machine
            </button>
          </div>
          <div className="special-actions wayback-pick">
            <label htmlFor="wayback-date">Or pick an earlier date:</label>
            <input id="wayback-date" type="date" min={WAYBACK_EARLIEST} max={today} value={date} onChange={(e) => setPicked(e.target.value)} />
            <button className="btn" disabled={pickedTime === null} onClick={() => pickedTime !== null && openOutside(waybackUrl(url.href, pickedTime))}>
              Open that date
            </button>
          </div>
          <p className="muted">
            The Wayback Machine is a real archive run by the Internet Archive, separate from the Connected Era. It opens in a new tab of the browser you&apos;re using right now. Old copies can be missing pictures, videos or links, and some pages were never saved.
          </p>
        </>
      )}
      <div className="special-actions">
        <button className="btn" onClick={() => openOutside(url.href)}>
          Open today&apos;s live site in your real browser
        </button>
        <button className="btn" onClick={() => navigate(searchUrl(url.host.split(".")[0]))}>
          Search the archive instead
        </button>
      </div>
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
        Search Connected Search for it
      </button>
    </div>
  );
}
