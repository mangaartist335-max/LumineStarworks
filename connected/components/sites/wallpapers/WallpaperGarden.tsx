"use client";

import { useSystem } from "@/components/system/system";
import { A, useSite, usePageTitle } from "../SiteContext";
import { wallpapers, WALLPAPER_HOST, type Wallpaper } from "@/data/wallpapers";
import { isListed } from "@/lib/availability";
import { formatDate } from "@/lib/time";
import { formatSize } from "@/lib/vfs";
import { siteUrl } from "@/lib/web/url";

const wg = (path: string, params?: Record<string, string | undefined>) => siteUrl(WALLPAPER_HOST, path, params);

function useWallpapers(): Wallpaper[] {
  const { now, computer } = useSystem();
  return wallpapers.filter((w) => isListed(w.availability, now(), computer.region)).sort((a, b) => b.availability.publishedAt.localeCompare(a.availability.publishedAt));
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="wallgarden">
      <header className="wg-header">
        <A href={wg("/")} className="wg-logo">
          🌿 WallpaperGarden
        </A>
        <span className="wg-tag">Free HD wallpapers for your desktop</span>
        <nav>
          {["Nature", "Space", "City", "Retro", "Abstract", "Seasons"].map((c) => (
            <A key={c} href={wg("/", { category: c })}>
              {c}
            </A>
          ))}
        </nav>
      </header>
      <main className="wg-main">{children}</main>
      <footer className="wg-footer">All artwork is shared by its artists for free personal desktop use.</footer>
    </div>
  );
}

function Gallery() {
  const { url } = useSite();
  const category = url.params.get("category");
  usePageTitle(category ? `${category} Wallpapers - WallpaperGarden` : "WallpaperGarden - Free Desktop Wallpapers");
  const list = useWallpapers().filter((w) => !category || w.category === category);
  return (
    <Shell>
      <h1>{category ? `${category} wallpapers` : "Newest wallpapers"}</h1>
      {list.length === 0 && <p className="empty">Nothing in this category yet.</p>}
      <div className="wg-grid">
        {list.map((w) => (
          <A key={w.key} href={wg(`/wallpaper/${w.key}`)} className="wg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={w.thumb} alt={w.title} />
            <strong>{w.title}</strong>
            <small>
              by {w.artist} · {w.width}x{w.height}
            </small>
          </A>
        ))}
      </div>
    </Shell>
  );
}

function Detail() {
  const { url } = useSite();
  const { download, computer } = useSystem();
  const key = url.path.split("/")[2];
  const w = useWallpapers().find((x) => x.key === key);
  usePageTitle(w ? `${w.title} Wallpaper - WallpaperGarden` : "WallpaperGarden");
  if (!w) {
    return (
      <Shell>
        <p className="empty">That wallpaper isn&apos;t on WallpaperGarden (yet).</p>
      </Shell>
    );
  }
  const filename = `${w.title.replace(/[^A-Za-z0-9 ]/g, "").replace(/\s+/g, "-")}-${w.width}x${w.height}.jpg`;
  return (
    <Shell>
      <div className="wg-detail">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={w.url} alt={w.title} className="wg-preview" />
        <div className="wg-side">
          <h1>{w.title}</h1>
          <p>{w.description}</p>
          <dl>
            <dt>Artist</dt>
            <dd>{w.artist}</dd>
            <dt>Resolution</dt>
            <dd>
              {w.width} x {w.height}
            </dd>
            <dt>File size</dt>
            <dd>{formatSize(w.size)}</dd>
            <dt>Added</dt>
            <dd>{formatDate(Date.parse(w.availability.publishedAt), computer.timeZone)}</dd>
            <dt>Downloads</dt>
            <dd>{w.downloads.toLocaleString("en-US")}</dd>
          </dl>
          <p className="wg-license">{w.license}</p>
          <button className="wg-download" onClick={() => void download(w.url, filename, { mime: "image/jpeg", source: wg(`/wallpaper/${w.key}`) })}>
            Download wallpaper ({formatSize(w.size)})
          </button>
          <p className="wg-hint">
            After downloading, open it from your Downloads folder and choose &quot;Set as desktop background&quot;.{" "}
            <A href="about:downloads">View downloads</A>
          </p>
        </div>
      </div>
    </Shell>
  );
}

export default function WallpaperGarden() {
  const { url } = useSite();
  return url.path.startsWith("/wallpaper/") ? <Detail /> : <Gallery />;
}
