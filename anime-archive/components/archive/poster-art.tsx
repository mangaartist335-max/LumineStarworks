import { hashNumber } from "@/lib/archive/ids";
import { FORMAT_SHORT } from "@/lib/archive/labels";
import type { ProductionFormat, Provenance } from "@/lib/archive/types";
import { cn } from "@/lib/utils";

interface PosterArtProps {
  slug: string;
  title: string;
  native?: string | null;
  format: ProductionFormat;
  year?: number | null;
  provenance?: Provenance;
  posterUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Large background character; defaults to the first character of the Japanese title. */
  glyph?: string;
}

/**
 * Placeholder key art generated from the production's slug. Every title gets
 * its own palette and motif, so galleries stay readable until approved
 * artwork is attached via `poster_url`.
 */
export function PosterArt({ slug, title, native, format, year, provenance, posterUrl, className, size = "md", glyph: glyphOverride }: PosterArtProps) {
  if (posterUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- approved artwork can live on any host
      <img src={posterUrl} alt="" className={cn("aspect-[2/3] w-full rounded-lg object-cover", className)} loading="lazy" />
    );
  }

  const h = hashNumber(slug);
  const hue = h % 360;
  const hue2 = (hue + 40 + ((h >> 9) % 80)) % 360;
  const motif = (h >> 4) % 4;
  const glowX = 20 + ((h >> 12) % 60);
  const glowY = 15 + ((h >> 16) % 40);
  const glyph = glyphOverride ?? native?.replace(/[\s・:：]/g, "").slice(0, 1) ?? title.slice(0, 1);

  return (
    <div
      aria-hidden
      className={cn("relative isolate aspect-[2/3] w-full overflow-hidden rounded-lg text-white shadow-md ring-1 ring-white/10", className)}
      style={{
        background: `radial-gradient(circle at ${glowX}% ${glowY}%, oklch(0.78 0.13 ${hue2} / 0.75), transparent 55%), linear-gradient(160deg, oklch(0.46 0.13 ${hue}) 0%, oklch(0.26 0.09 ${hue2}) 62%, oklch(0.16 0.05 ${hue2}) 100%)`,
      }}
    >
      <svg viewBox="0 0 200 300" className="absolute inset-0 size-full opacity-40 mix-blend-soft-light" preserveAspectRatio="xMidYMid slice">
        {motif === 0 &&
          [40, 70, 100, 130].map((r) => <circle key={r} cx={glowX * 2} cy={glowY * 3} r={r} fill="none" stroke="white" strokeWidth="1.2" />)}
        {motif === 1 &&
          Array.from({ length: 14 }, (_, i) => <line key={i} x1={-80 + i * 26} y1="0" x2={40 + i * 26} y2="300" stroke="white" strokeWidth="5" />)}
        {motif === 2 &&
          Array.from({ length: 28 }, (_, i) => {
            const x = (hashNumber(`${slug}:${i}`) % 200) | 0;
            const y = (hashNumber(`${slug}:y${i}`) % 300) | 0;
            return <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 2.4 : 1.1} fill="white" />;
          })}
        {motif === 3 &&
          Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M -10 ${60 + i * 26} Q 50 ${40 + i * 26} 100 ${60 + i * 26} T 210 ${60 + i * 26}`} fill="none" stroke="white" strokeWidth="1.6" />
          ))}
      </svg>
      <span className="pointer-events-none absolute -right-3 top-6 select-none font-jp text-[7rem] font-black leading-none text-white/12">{glyph}</span>
      {native && size !== "sm" && (
        <span className="vertical-jp absolute right-2.5 top-10 max-h-[55%] overflow-hidden font-jp text-[0.7rem] font-semibold tracking-widest text-white/75">{native}</span>
      )}
      <div className="absolute left-2.5 top-2.5 flex items-center gap-1">
        <span className="rounded bg-black/35 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider backdrop-blur-sm">{FORMAT_SHORT[format]}</span>
        {provenance === "proposed" && (
          <span className="rounded border border-dashed border-white/50 bg-black/30 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider backdrop-blur-sm">Proposed</span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-3 pt-10">
        {year && <div className="mb-1 font-mono text-[0.6rem] font-semibold tracking-widest text-white/70">{year}</div>}
        <div className={cn("font-extrabold leading-tight tracking-tight text-balance", size === "lg" ? "text-xl" : size === "sm" ? "text-[0.7rem]" : "text-sm")}>{title}</div>
      </div>
    </div>
  );
}
