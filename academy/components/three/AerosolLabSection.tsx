"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MousePointer2, ShieldCheck, ShieldOff } from "lucide-react";
import clsx from "clsx";

const AerosolLab = dynamic(() => import("./AerosolLab"), { ssr: false });

export function AerosolLabSection() {
  const [shieldOn, setShieldOn] = useState(true);

  return (
    <div className="night grain relative overflow-hidden rounded-[2.5rem] text-white">
      <AerosolLab className="absolute inset-0" shieldOn={shieldOn} />
      <div className="vignette pointer-events-none absolute inset-0" />
      {/* A soft shade behind the words so they stay easy to read */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0b1c33]/80 via-[#0b1c33]/40 to-transparent md:bg-gradient-to-r md:from-[#0b1c33]/70 md:via-[#0b1c33]/25" />
      <div className="pointer-events-none relative min-h-[800px] p-8 sm:p-12 md:min-h-[540px]">
        <div className="max-w-md">
          <span className="eyebrow-dark">Interactive lab</span>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
            See the air the way <span className="gradient-text-light">we teach it</span>
          </h2>
          <p className="mt-4 text-white/75">
            Every glowing dot is a tiny aerosol particle drifting on the air. Move your cursor to
            stir them up, then watch how a well-fitted shield guides them safely around.
          </p>
          <div className="pointer-events-auto mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShieldOn((v) => !v)}
              aria-pressed={shieldOn}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition",
                shieldOn ? "bg-white text-foreground hover:bg-brand-soft" : "bg-accent text-white hover:bg-accent-dark"
              )}
            >
              {shieldOn ? <ShieldOff className="h-4 w-4" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />}
              {shieldOn ? "Take the shield away" : "Bring the shield back"}
            </button>
          </div>
          <p className="animate-hint mt-6 flex items-center gap-2 text-sm text-white/70 md:absolute md:bottom-10 md:left-12 md:mt-0">
            <MousePointer2 className="h-4 w-4" aria-hidden /> Move your cursor (or finger) across the scene
          </p>
        </div>
      </div>
    </div>
  );
}
