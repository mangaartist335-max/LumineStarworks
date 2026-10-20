"use client";

import { Disc3, Music2, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/archive/empty-state";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/archive/dates";
import { THEME_USAGE_LABEL, THEME_USAGE_SHORT, TRACK_KIND_LABEL } from "@/lib/archive/labels";
import type { ComposerRow, MusicRow } from "@/lib/archive/queries";
import type { ThemeUsage, TrackKind } from "@/lib/archive/types";
import { plural } from "@/lib/utils";

export function MusicArchive({ tracks, composers, initialQuery }: { tracks: MusicRow[]; composers: ComposerRow[]; initialQuery: string }) {
  const [song, setSong] = useState(initialQuery);
  const [composer, setComposer] = useState("");
  const [singer, setSinger] = useState("");
  const [production, setProduction] = useState("");
  const [year, setYear] = useState("");
  const [usage, setUsage] = useState<ThemeUsage | "">("");

  const options = useMemo(() => {
    const singers = new Set<string>();
    const composerNames = new Set<string>();
    const productions = new Set<string>();
    const years = new Set<number>();
    for (const t of tracks) {
      t.performers.forEach((p) => singers.add(p.name));
      t.composers.forEach((c) => composerNames.add(c.name));
      t.usages.forEach((u) => productions.add(u.production.title));
      if (t.release_year) years.add(t.release_year);
    }
    composers.forEach((c) => composerNames.add(c.name));
    return {
      singers: [...singers].sort(),
      composers: [...composerNames].sort(),
      productions: [...productions].sort(),
      years: [...years].sort((a, b) => b - a),
    };
  }, [tracks, composers]);

  // A production's composer also counts as the composer of its songs and soundtrack.
  const scoreComposersByProduction = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of composers) for (const s of c.scores) map.set(s.title, [...(map.get(s.title) ?? []), c.name]);
    return map;
  }, [composers]);

  const shown = tracks.filter((t) => {
    if (song && ![t.title, t.title_native].some((v) => v?.toLowerCase().includes(song.trim().toLowerCase()))) return false;
    if (singer && !t.performers.some((p) => p.name === singer)) return false;
    if (production && !t.usages.some((u) => u.production.title === production)) return false;
    if (year && t.release_year !== Number(year)) return false;
    if (usage && !t.usages.some((u) => u.usage === usage)) return false;
    if (composer) {
      const direct = t.composers.some((c) => c.name === composer);
      const viaScore = t.usages.some((u) => scoreComposersByProduction.get(u.production.title)?.includes(composer));
      if (!direct && !viaScore) return false;
    }
    return true;
  });

  const shownComposers = composers.filter((c) => !composer || c.name === composer).filter((c) => !production || c.scores.some((s) => s.title === production));

  return (
    <Tabs defaultValue="songs">
      <TabsList aria-label="Music archive sections">
        <TabsTrigger value="songs">
          <Music2 aria-hidden /> Songs & releases
        </TabsTrigger>
        <TabsTrigger value="composers">
          <Disc3 aria-hidden /> Composers & scores
        </TabsTrigger>
      </TabsList>

      <div className="grid gap-2 rounded-xl border bg-card/50 p-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <label htmlFor="music-song" className="sr-only">
            Song title
          </label>
          <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="music-song" value={song} onChange={(e) => setSong(e.target.value)} placeholder="Song title" className="pl-8" />
        </div>
        <Filter id="music-composer" label="Composer" value={composer} onChange={setComposer} options={options.composers} />
        <Filter id="music-singer" label="Singer" value={singer} onChange={setSinger} options={options.singers} />
        <Filter id="music-production" label="Production" value={production} onChange={setProduction} options={options.productions} />
        <div className="grid grid-cols-2 gap-2">
          <Filter id="music-year" label="Year" value={year} onChange={setYear} options={options.years.map(String)} />
          <div>
            <label htmlFor="music-usage" className="sr-only">
              Usage
            </label>
            <NativeSelect id="music-usage" value={usage} onChange={(e) => setUsage(e.target.value as ThemeUsage | "")}>
              <option value="">Any use</option>
              {(["opening", "ending", "insert", "soundtrack"] as ThemeUsage[]).map((u) => (
                <option key={u} value={u}>
                  {THEME_USAGE_SHORT[u]}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </div>

      <TabsContent value="songs" className="space-y-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {plural(shown.length, "track")}
        </p>
        {shown.length === 0 ? (
          <EmptyState icon={Music2} title="No tracks match" description="Try a different song title or clear a filter." />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((t) => (
              <li key={t.slug} className="flex flex-col gap-2 rounded-xl border bg-card/50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug">“{t.title}”</p>
                    {t.title_native && <p className="font-jp text-xs text-muted-foreground">{t.title_native}</p>}
                  </div>
                  {t.provenance !== "proposed" && <ProvenanceBadge provenance={t.provenance} />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.performers.length > 0 ? (
                    <>
                      by{" "}
                      {t.performers.map((p, i) => (
                        <span key={p.slug}>
                          {i > 0 && ", "}
                          <Link href={`/staff/${p.slug}`} className="font-medium text-foreground hover:text-primary">
                            {p.name}
                          </Link>
                        </span>
                      ))}
                    </>
                  ) : t.composers.length > 0 ? (
                    <>Composed by {t.composers.map((c) => c.name).join(", ")}</>
                  ) : (
                    "Performer not yet documented"
                  )}
                </p>
                <ul className="space-y-0.5 text-xs">
                  {t.usages.map((u) => (
                    <li key={u.production.slug + u.usage}>
                      <Link href={`/anime/${u.production.slug}?tab=music`} className="text-muted-foreground hover:text-primary">
                        <span className="font-semibold text-primary">{THEME_USAGE_LABEL[u.usage as ThemeUsage]}</span> · {u.production.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-auto pt-1 text-xs text-muted-foreground">
                  {TRACK_KIND_LABEL[t.kind as TrackKind]}
                  {t.release_date ? ` · ${formatDate(t.release_date, "short")}` : t.release_year ? ` · ${t.release_year}` : ""}
                  {t.label ? ` · ${t.label}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="composers">
        {shownComposers.length === 0 ? (
          <EmptyState icon={Disc3} title="No composers match" />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shownComposers.map((c) => (
              <li key={c.slug} className="rounded-xl border bg-card/50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/staff/${c.slug}`} className="font-semibold hover:text-primary">
                    {c.name}
                    {c.name_native && <span className="block font-jp text-xs font-normal text-muted-foreground">{c.name_native}</span>}
                  </Link>
                  {c.provenance !== "proposed" && <ProvenanceBadge provenance={c.provenance} />}
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Original scores ({c.scores.length})</p>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {c.scores.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/anime/${s.slug}`} className="hover:text-primary">
                        {s.title}
                      </Link>
                      {s.year && <span className="ml-1.5 font-mono text-xs text-muted-foreground">{s.year}</span>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  );
}

function Filter({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
