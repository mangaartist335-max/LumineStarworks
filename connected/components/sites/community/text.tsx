"use client";

// Turns user-written text into safe React nodes: links become in-browser
// links, everything else stays plain text (never HTML).

import { Fragment, useEffect, useState } from "react";
import { useSystem } from "@/components/system/system";
import { A } from "../SiteContext";

const LINK = /\b((?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:com|net|org)(?:\/[^\s]*)?)/gi;

export function Linkified({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const start = m.index!;
    if (start > last) parts.push(text.slice(last, start));
    const raw = m[1].replace(/[.,!?)]+$/, "");
    const href = raw.startsWith("http") ? raw : `http://${raw.startsWith("www.") ? raw : `www.${raw}`}`;
    parts.push(
      <A key={start} href={href}>
        {raw}
      </A>,
    );
    last = start + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}

/** Blob-backed image (a picture someone attached from their computer). */
export function BlobImage({ blobId, alt, className }: { blobId: string; alt: string; className?: string }) {
  const { store } = useSystem();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let revoke = () => {};
    let alive = true;
    store.getBlob(blobId).then((b) => {
      if (!b || !alive) return;
      const u = URL.createObjectURL(b);
      revoke = () => URL.revokeObjectURL(u);
      setUrl(u);
    });
    return () => {
      alive = false;
      revoke();
    };
  }, [blobId, store]);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt={alt} className={className} /> : null;
}

/** Lets someone pick a picture from their computer to attach. */
export function PicturePicker({ value, onChange }: { value: string; onChange: (fileId: string) => void }) {
  const { store, user } = useSystem();
  const [pics, setPics] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    store.list<{ id: string; owner: string; kind: string; mime?: string; name: string; trashed?: unknown }>("files").then((all) => setPics(all.filter((f) => f.owner === user?.id && f.kind === "file" && f.mime?.startsWith("image/") && !f.trashed)));
  }, [store, user]);
  return (
    <select className="field" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Attach a picture">
      <option value="">No picture</option>
      {pics.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
