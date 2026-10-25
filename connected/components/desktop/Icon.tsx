// The Connected PC's icon set: glossy early-2010s style, drawn in SVG.

import { useId } from "react";

export type IconName =
  | "computer" | "folder" | "folder-pictures" | "folder-music" | "folder-videos" | "folder-downloads" | "folder-documents"
  | "recycle" | "recycle-full" | "browser" | "messenger" | "mail" | "music" | "video" | "photos" | "notepad" | "paint"
  | "archive" | "pdf" | "calculator" | "games" | "rocket" | "sweeper" | "settings" | "user" | "search" | "download"
  | "file" | "file-image" | "file-audio" | "file-video" | "file-pdf" | "file-zip" | "file-text" | "file-link"
  | "power" | "restart" | "logoff" | "star" | "metube" | "manga" | "volume" | "mute" | "network" | "back" | "forward"
  | "reload" | "home" | "close" | "plus" | "info" | "warning";

function Folder({ g, tint = "#f6c958", badge }: { g: string; tint?: string; badge?: React.ReactNode }) {
  return (
    <>
      <defs>
        <linearGradient id={`${g}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="1" stopColor={tint} />
        </linearGradient>
      </defs>
      <path d="M4 10 h16 l4 4 h20 v26 a2 2 0 0 1-2 2 H6 a2 2 0 0 1-2-2z" fill="#d9a632" />
      <path d="M4 16 h40 v24 a2 2 0 0 1-2 2 H6 a2 2 0 0 1-2-2z" fill={`url(#${g}f)`} stroke="#c8922a" />
      {badge}
    </>
  );
}

function Page({ g, color, label }: { g: string; color: string; label?: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${g}p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6ecf3" />
        </linearGradient>
      </defs>
      <path d="M10 4 h20 l10 10 v30 H10z" fill={`url(#${g}p)`} stroke="#8a99ad" />
      <path d="M30 4 v10 h10" fill="#cfd9e6" stroke="#8a99ad" />
      <rect x="10" y="30" width="30" height="10" fill={color} />
      {label && (
        <text x="25" y="38" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fff" fontFamily="Arial">
          {label}
        </text>
      )}
    </>
  );
}

export function Icon({ name, size = 32, title }: { name: IconName; size?: number; title?: string }) {
  const g = useId().replace(/:/g, "");
  const body = (() => {
    switch (name) {
      case "computer":
        return (
          <>
            <rect x="4" y="6" width="40" height="28" rx="2" fill="#2b3a4f" />
            <rect x="7" y="9" width="34" height="22" fill="#3d8fe0" />
            <path d="M7 9 h34 v8 C30 14 18 20 7 17z" fill="#8cc6ff" opacity=".6" />
            <rect x="18" y="34" width="12" height="5" fill="#8a96a8" />
            <rect x="12" y="39" width="24" height="3" rx="1" fill="#5d6a7c" />
          </>
        );
      case "folder":
        return <Folder g={g} />;
      case "folder-pictures":
        return <Folder g={g} badge={<><rect x="16" y="20" width="18" height="14" fill="#fff" stroke="#999" /><path d="M17 33 l5-6 4 4 3-3 4 5z" fill="#4a9a4a" /><circle cx="29" cy="24" r="2" fill="#f2b632" /></>} />;
      case "folder-music":
        return <Folder g={g} badge={<path d="M28 20 v11 a3 3 0 1 1-2-2.8 V22 l-6 1.5 v9 a3 3 0 1 1-2-2.8 V21z" fill="#3a5fa8" />} />;
      case "folder-videos":
        return <Folder g={g} badge={<><rect x="16" y="21" width="18" height="12" rx="1" fill="#333" /><path d="M23 24 l6 3-6 3z" fill="#fff" /></>} />;
      case "folder-downloads":
        return <Folder g={g} badge={<path d="M22 19 h6 v8 h4 l-7 7-7-7 h4z" fill="#2f8f3a" />} />;
      case "folder-documents":
        return <Folder g={g} badge={<><rect x="18" y="19" width="14" height="16" fill="#fff" stroke="#999" /><path d="M20 23 h10 M20 26 h10 M20 29 h7" stroke="#7a8ba0" /></>} />;
      case "recycle":
      case "recycle-full":
        return (
          <>
            <defs>
              <linearGradient id={`${g}r`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#cfe6f7" />
                <stop offset=".5" stopColor="#ffffff" />
                <stop offset="1" stopColor="#b5d3ea" />
              </linearGradient>
            </defs>
            <path d="M10 12 h28 l-3 30 H13z" fill={`url(#${g}r)`} stroke="#6f8fa8" />
            <rect x="8" y="8" width="32" height="5" rx="2" fill="#9fc0dc" stroke="#6f8fa8" />
            {name === "recycle-full" && <path d="M14 12 c4-6 8-2 10-6 c3 4 7 0 10 6z" fill="#f4f0e2" stroke="#b8b2a0" />}
            <path d="M20 22 l4-5 4 5 M18 30 l-2 6 h7 M30 30 l2 6 h-7" fill="none" stroke="#3c8d3c" strokeWidth="2" />
          </>
        );
      case "browser":
        return (
          <>
            <defs>
              <radialGradient id={`${g}b`} cx=".35" cy=".3" r=".8">
                <stop offset="0" stopColor="#bfe8ff" />
                <stop offset=".6" stopColor="#2f8de4" />
                <stop offset="1" stopColor="#14508f" />
              </radialGradient>
            </defs>
            <circle cx="24" cy="24" r="19" fill={`url(#${g}b)`} />
            <path d="M12 16 c5 2 6-4 11-3 s3 6 8 5 5 4 3 7-6 1-7 6-6 6-8 3 2-6-3-8-7-1-7-5z" fill="#5cbf53" opacity=".9" />
            <ellipse cx="24" cy="24" rx="19" ry="19" fill="none" stroke="#0e3d70" />
            <path d="M8 16 Q24 6 40 16" stroke="#fff" strokeOpacity=".5" fill="none" strokeWidth="2" />
          </>
        );
      case "messenger":
        return (
          <>
            <circle cx="18" cy="15" r="7" fill="#47b24a" />
            <path d="M6 38 c0-10 6-14 12-14 s12 4 12 14z" fill="#47b24a" />
            <circle cx="31" cy="17" r="7" fill="#2f7fd8" />
            <path d="M19 40 c0-10 6-14 12-14 s12 4 12 14z" fill="#2f7fd8" />
          </>
        );
      case "mail":
        return (
          <>
            <rect x="5" y="11" width="38" height="26" rx="2" fill="#f7f9fc" stroke="#7d8fa6" />
            <path d="M5 13 l19 14 19-14" fill="none" stroke="#7d8fa6" strokeWidth="2" />
            <path d="M5 37 l14-12 M43 37 l-14-12" stroke="#b5c2d3" />
            <circle cx="38" cy="12" r="6" fill="#e8483c" />
          </>
        );
      case "music":
        return (
          <>
            <circle cx="24" cy="24" r="19" fill="#f39c26" />
            <circle cx="24" cy="24" r="19" fill="none" stroke="#b5650d" />
            <path d="M30 12 v17 a4 4 0 1 1-3-3.9 V17 l-8 2 v13 a4 4 0 1 1-3-3.9 V16z" fill="#fff" />
          </>
        );
      case "video":
        return (
          <>
            <rect x="5" y="10" width="38" height="28" rx="3" fill="#2a2f3a" />
            <rect x="8" y="13" width="32" height="22" fill="#3a6ea8" />
            <path d="M21 18 l10 6-10 6z" fill="#fff" />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={6} y={12 + i * 7} width="2" height="3" fill="#ccc" />
            ))}
          </>
        );
      case "photos":
        return (
          <>
            <rect x="6" y="8" width="36" height="30" rx="2" fill="#fff" stroke="#8a99ad" />
            <rect x="9" y="11" width="30" height="20" fill="#8fd0ff" />
            <path d="M9 31 l9-10 7 7 5-4 9 7z" fill="#3e9a43" />
            <circle cx="32" cy="16" r="3" fill="#ffd34d" />
          </>
        );
      case "notepad":
        return (
          <>
            <rect x="10" y="6" width="28" height="36" fill="#fffbe0" stroke="#a69f6a" />
            {[14, 19, 24, 29, 34].map((y) => (
              <path key={y} d={`M14 ${y} h20`} stroke="#9fb3d1" />
            ))}
            <rect x="10" y="4" width="28" height="5" fill="#4a7fc0" />
          </>
        );
      case "paint":
        return (
          <>
            <path d="M24 6 c11 0 19 7 19 16 0 6-5 7-8 6-3-1-6 1-5 4 1 4-2 9-7 9 C12 41 5 33 5 24 5 14 13 6 24 6z" fill="#f3e3c4" stroke="#a6875a" />
            <circle cx="15" cy="18" r="3.5" fill="#e33c3c" />
            <circle cx="24" cy="13" r="3.5" fill="#f2c230" />
            <circle cx="33" cy="17" r="3.5" fill="#3b9de0" />
            <circle cx="13" cy="28" r="3.5" fill="#46a646" />
          </>
        );
      case "archive":
        return (
          <>
            <rect x="8" y="8" width="32" height="34" rx="2" fill="#f2d48a" stroke="#a6823a" />
            <rect x="20" y="8" width="8" height="34" fill="#c99a3a" />
            {[12, 16, 20, 24].map((y) => (
              <rect key={y} x="22" y={y} width="4" height="2" fill="#6b4c12" />
            ))}
            <rect x="20" y="27" width="8" height="7" rx="1" fill="#6b4c12" />
          </>
        );
      case "pdf":
      case "file-pdf":
        return <Page g={g} color="#d6312c" label="PDF" />;
      case "calculator":
        return (
          <>
            <rect x="10" y="5" width="28" height="38" rx="3" fill="#4b5563" />
            <rect x="13" y="8" width="22" height="9" fill="#cde8c5" />
            {[0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={13 + c * 8} y={21 + r * 7} width="6" height="5" rx="1" fill={c === 2 ? "#f39c26" : "#e5e7eb"} />),
            )}
          </>
        );
      case "games":
        return (
          <>
            <path d="M10 16 h28 c4 0 6 4 6 9 0 8-3 13-7 13-3 0-5-4-8-4 h-10 c-3 0-5 4-8 4 C7 38 4 33 4 25 c0-5 2-9 6-9z" fill="#5b6475" />
            <path d="M12 23 h3 v-3 h3 v3 h3 v3 h-3 v3 h-3 v-3 h-3z" fill="#e5e7eb" />
            <circle cx="33" cy="22" r="2.5" fill="#46c46b" />
            <circle cx="37" cy="27" r="2.5" fill="#e04b4b" />
          </>
        );
      case "rocket":
        return (
          <>
            <circle cx="24" cy="24" r="20" fill="#14204a" />
            <path d="M34 14 l-18 10 6 2 2 6z" fill="#e8eefc" />
            <path d="M22 26 l-6 6 M24 32 l-2 6" stroke="#ffb13b" strokeWidth="3" />
            <circle cx="12" cy="12" r="1" fill="#fff" />
            <circle cx="36" cy="34" r="1" fill="#fff" />
          </>
        );
      case "sweeper":
        return (
          <>
            <rect x="5" y="5" width="38" height="38" rx="2" fill="#c7d3e3" stroke="#7d8fa6" />
            <circle cx="24" cy="26" r="8" fill="#7a3e9e" />
            <path d="M24 10 v8 M16 14 l4 6 M32 14 l-4 6" stroke="#3f7f3f" strokeWidth="2" />
          </>
        );
      case "settings":
        return (
          <>
            <circle cx="24" cy="24" r="13" fill="none" stroke="#6b7a90" strokeWidth="8" strokeDasharray="5 3.2" />
            <circle cx="24" cy="24" r="10" fill="#8fa3bd" stroke="#55657c" />
            <circle cx="24" cy="24" r="4" fill="#eef2f7" />
          </>
        );
      case "user":
        return (
          <>
            <rect x="4" y="4" width="40" height="40" rx="4" fill="#6fa8dc" />
            <circle cx="24" cy="19" r="8" fill="#fff" />
            <path d="M10 42 c0-9 6-13 14-13 s14 4 14 13z" fill="#fff" />
          </>
        );
      case "search":
        return (
          <>
            <circle cx="20" cy="20" r="11" fill="none" stroke="#3a5f8f" strokeWidth="4" />
            <path d="M28 28 l12 12" stroke="#3a5f8f" strokeWidth="6" strokeLinecap="round" />
          </>
        );
      case "download":
        return (
          <>
            <circle cx="24" cy="24" r="19" fill="#3ba24a" />
            <path d="M20 12 h8 v12 h6 l-10 11-10-11 h6z" fill="#fff" />
          </>
        );
      case "file":
        return <Page g={g} color="#8a99ad" />;
      case "file-image":
        return <Page g={g} color="#3e9a43" label="IMG" />;
      case "file-audio":
        return <Page g={g} color="#f08c1a" label="MP3" />;
      case "file-video":
        return <Page g={g} color="#3a6ea8" label="VID" />;
      case "file-zip":
        return <Page g={g} color="#b8892e" label="ZIP" />;
      case "file-text":
        return <Page g={g} color="#5d7fa8" label="TXT" />;
      case "file-link":
        return <Page g={g} color="#2f8de4" label="URL" />;
      case "metube":
        return (
          <>
            <rect x="4" y="10" width="40" height="28" rx="8" fill="#e5332a" />
            <path d="M20 17 l12 7-12 7z" fill="#fff" />
          </>
        );
      case "manga":
        return (
          <>
            <path d="M24 10 c-6-4-14-4-19-2 v30 c5-2 13-2 19 2z" fill="#fff" stroke="#555" />
            <path d="M24 10 c6-4 14-4 19-2 v30 c-5-2-13-2-19 2z" fill="#f0f0f0" stroke="#555" />
            <path d="M9 16 h11 M9 21 h11 M28 16 h11 M28 21 h11" stroke="#999" />
          </>
        );
      case "power":
        return (
          <>
            <path d="M15 14 a13 13 0 1 0 18 0" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            <path d="M24 6 v18" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          </>
        );
      case "restart":
        return <path d="M38 24 a14 14 0 1 1-4-10 M36 6 v9 h-9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />;
      case "logoff":
        return <path d="M20 8 H10 v32 h10 M30 16 l8 8-8 8 M38 24 H18" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />;
      case "star":
        return <path d="M24 5 l5.8 12 13.2 1.9-9.5 9.3 2.2 13.1L24 35l-11.7 6.3 2.2-13.1L5 18.9 18.2 17z" fill="#f5c518" stroke="#b58a00" />;
      case "volume":
        return <path d="M8 18 h8 l10-8 v28 l-10-8 H8z M32 16 c4 4 4 12 0 16 M36 11 c7 7 7 19 0 26" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />;
      case "mute":
        return <path d="M8 18 h8 l10-8 v28 l-10-8 H8z M32 18 l10 12 M42 18 l-10 12" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />;
      case "network":
        return (
          <>
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={8 + i * 9} y={34 - i * 8} width="6" height={8 + i * 8} fill="currentColor" />
            ))}
          </>
        );
      case "back":
        return <path d="M28 10 L14 24 l14 14" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />;
      case "forward":
        return <path d="M20 10 l14 14-14 14" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />;
      case "reload":
        return <path d="M38 24 a14 14 0 1 1-4-10 M36 6 v9 h-9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />;
      case "home":
        return <path d="M6 24 L24 8 l18 16 M12 20 v18 h9 v-10 h6 v10 h9 V20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />;
      case "close":
        return <path d="M12 12 l24 24 M36 12 L12 36" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />;
      case "plus":
        return <path d="M24 10 v28 M10 24 h28" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />;
      case "info":
        return (
          <>
            <circle cx="24" cy="24" r="19" fill="#2f7fd8" />
            <rect x="21.5" y="20" width="5" height="16" rx="2" fill="#fff" />
            <circle cx="24" cy="14" r="3" fill="#fff" />
          </>
        );
      case "warning":
        return (
          <>
            <path d="M24 5 L44 41 H4z" fill="#f5c518" stroke="#b58a00" />
            <rect x="21.5" y="16" width="5" height="14" rx="2" fill="#333" />
            <circle cx="24" cy="35" r="2.5" fill="#333" />
          </>
        );
    }
  })();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} className="icon">
      {body}
    </svg>
  );
}
