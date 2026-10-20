import { Film, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/archive/page-header";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { summarizeStudios } from "@/lib/archive/queries";
import { archiveToday, loadArchive } from "@/lib/archive/server";
import { plural } from "@/lib/utils";

export const metadata: Metadata = { title: "Studio directory", description: "Every animation studio in the archive, with filmographies, key staff and collaborations." };

export default async function StudiosPage() {
  const index = await loadArchive();
  const studios = summarizeStudios(index, archiveToday());
  return (
    <>
      <PageHeader eyebrow="Studio directory" title="Animation studios" description={`${plural(studios.length, "studio")} with production histories, key staff and collaborations.`} />
      <div className="container-page py-10">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studios.map((s) => (
            <li key={s.slug}>
              <Link href={`/studios/${s.slug}`} className="group flex h-full flex-col gap-3 rounded-xl border bg-card/50 p-5 transition-colors hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <Film aria-hidden className="size-5" />
                  </span>
                  <ProvenanceBadge provenance={s.provenance} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold group-hover:text-primary">{s.name}</h2>
                  {s.name_native && <p className="font-jp text-sm text-muted-foreground">{s.name_native}</p>}
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin aria-hidden className="size-3.5" />
                  {[s.founded_year && `Founded ${s.founded_year}`, s.location].filter(Boolean).join(" · ") || "Founding details not yet documented"}
                </p>
                {s.animation_style && <p className="line-clamp-2 text-sm text-muted-foreground">{s.animation_style}</p>}
                <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                  <span>
                    <span className="font-mono text-base font-bold text-foreground">{s.productions}</span> productions
                  </span>
                  {s.latest && <span className="truncate pl-3">Latest: {s.latest.title}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
