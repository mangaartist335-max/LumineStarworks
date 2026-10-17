"use client";

import { Canvas, useFrame, type CanvasProps } from "@react-three/fiber";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import clsx from "clsx";
import { MotionToggle, isMotionStill, useMotionStill } from "../motion";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/** True when the scene should hold still (reduced motion or paused). */
export function useReducedMotion() {
  return useMotionStill();
}

// Turns requested from the keyboard, shared with <KeyRig> inside the scene.
type KeyTurns = { rx: number; ry: number; spin: number };
const KeyTurnsContext = createContext<React.RefObject<KeyTurns> | null>(null);

/** Wrap a scene's models in this so arrow keys and Enter can turn them. */
export function KeyRig({ children }: { children: React.ReactNode }) {
  const turns = useContext(KeyTurnsContext);
  const ref = useRef<THREE.Group>(null);
  const baseY = useRef(0);
  const spun = useRef(0);

  useFrame((_, delta) => {
    const g = ref.current;
    const t = turns?.current;
    if (!g || !t) return;
    const k = Math.min(1, delta * 5);
    baseY.current = THREE.MathUtils.lerp(baseY.current, t.ry, k);
    spun.current = THREE.MathUtils.lerp(spun.current, t.spin, k);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, t.rx, k);
    g.rotation.y = baseY.current + spun.current;
  });

  return <group ref={ref}>{children}</group>;
}

const clamp = THREE.MathUtils.clamp;

// A Canvas that only renders while it's on screen, can be explored with the
// keyboard, describes itself to screen readers, and carries a pause button.
export function SceneFrame({
  className,
  children,
  camera,
  label,
  keyboard = true,
  toggle = true,
  toggleClassName,
  hintClassName,
  dark = false,
  ...rest
}: CanvasProps & {
  className?: string;
  /** What the scene shows, read out by screen readers. */
  label?: string;
  /** Let arrow keys turn the scene and Enter spin it. */
  keyboard?: boolean;
  /** Show a pause/play animations button in the corner. */
  toggle?: boolean;
  toggleClassName?: string;
  /** Where the keyboard how-to appears while the scene has focus. */
  hintClassName?: string;
  /** The scene sits on a dark background. */
  dark?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const turns = useRef<KeyTurns>({ rx: 0, ry: 0, spin: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "120px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    const t = turns.current;
    switch (e.key) {
      case "ArrowLeft":
        t.ry = clamp(t.ry - 0.35, -1.4, 1.4);
        break;
      case "ArrowRight":
        t.ry = clamp(t.ry + 0.35, -1.4, 1.4);
        break;
      case "ArrowUp":
        t.rx = clamp(t.rx - 0.25, -0.75, 0.75);
        break;
      case "ArrowDown":
        t.rx = clamp(t.rx + 0.25, -0.75, 0.75);
        break;
      case "Enter":
      case " ":
        // A full happy spin, or a calm quarter turn when motion is paused.
        t.spin += isMotionStill() ? Math.PI / 2 : Math.PI * 2;
        break;
      case "Escape":
      case "Home":
        t.rx = 0;
        t.ry = 0;
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  return (
    <div ref={ref} className={className}>
      <div
        className={clsx("scene-focus absolute inset-0", dark && "on-dark")}
        {...(keyboard
          ? {
              tabIndex: 0,
              role: "group",
              "aria-roledescription": "3D scene",
              "aria-label": `${label ?? "Interactive 3D scene"}. Use the arrow keys to turn it, Enter to spin it and Escape to reset.`,
              onKeyDown,
            }
          : { "aria-hidden": true })}
      >
        <KeyTurnsContext.Provider value={turns}>
          <Canvas
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: true }}
            camera={camera ?? { position: [0, 0, 8], fov: 35 }}
            frameloop={visible ? "always" : "never"}
            aria-hidden
            {...rest}
          >
            {children}
          </Canvas>
        </KeyTurnsContext.Provider>
        {keyboard && (
          <p
            className={clsx(
              "scene-keys pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold",
              hintClassName ?? "top-3",
              dark ? "bg-white/15 text-white backdrop-blur" : "bg-white/85 text-foreground"
            )}
            aria-hidden
          >
            ← → turn · Enter spin · Esc reset
          </p>
        )}
      </div>
      {toggle && (
        <MotionToggle
          compact
          tone={dark ? "dark" : "light"}
          className={clsx("absolute z-10", toggleClassName ?? "bottom-3 right-3")}
        />
      )}
    </div>
  );
}
