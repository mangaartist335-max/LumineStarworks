"use client";

import { Float } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SceneFrame, useMediaQuery, useReducedMotion } from "./SceneFrame";
import { COLORS, Glossy, usePlusGeometry, useShieldGeometry } from "./shapes";
import { Studio } from "./Studio";

// Roughly this many particles per square unit of scene, capped for big screens.
const DENSITY = 17;
const MAX_COUNT = 1400;

// A soft, round glow for each particle.
function makeDotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.3, "rgba(255,255,255,0.75)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

type ShieldSpot = { x: number; y: number; rx: number; ry: number; scale: number };

// Particles drift across like air. Your pointer stirs them, a breeze sweeps
// them along, and the shield gently guides them around it, like a
// well-fitted respirator. When motion is paused they rest, and only move
// while you stir them, send a breeze or switch the shield.
function Particles({ shieldOn, spot, gust }: { shieldOn: boolean; spot: ShieldSpot; gust: number }) {
  const ref = useRef<THREE.Points>(null);
  const { viewport, pointer } = useThree();
  const still = useReducedMotion();
  const lastPointer = useRef({ x: 0, y: 0, at: -10 });
  const gustAt = useRef(-10);
  const settleUntil = useRef(0);
  const pending = useRef({ gust: false, settle: true });

  useEffect(() => {
    if (gust > 0) pending.current.gust = true;
  }, [gust]);
  useEffect(() => {
    pending.current.settle = true;
  }, [shieldOn]);
  const halfW = viewport.width / 2 + 0.5;
  const halfH = viewport.height / 2;

  // Seeded once from the first view size; particles then wrap around.
  const [{ count, positions, colors, seeds, dot }] = useState(() => {
    const count = Math.round(Math.min(MAX_COUNT, halfW * 2 * halfH * 2 * DENSITY));
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sky = new THREE.Color(COLORS.sky);
    const pink = new THREE.Color(COLORS.pink);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() * 2 - 1) * halfW;
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * halfH;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      c.copy(sky).lerp(pink, Math.random());
      colors.set([c.r, c.g, c.b], i * 3);
      seeds[i] = Math.random() * 100;
    }
    return { count, positions, colors, seeds, dot: makeDotTexture() };
  });

  useFrame((state, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    const lp = lastPointer.current;
    if (pointer.x !== lp.x || pointer.y !== lp.y) {
      lastPointer.current = { x: pointer.x, y: pointer.y, at: t };
    }
    if (pending.current.gust) {
      pending.current.gust = false;
      gustAt.current = t;
      settleUntil.current = Math.max(settleUntil.current, t + 2.2);
    }
    if (pending.current.settle) {
      pending.current.settle = false;
      settleUntil.current = Math.max(settleUntil.current, t + 1.6);
    }
    const stirring = t - lastPointer.current.at < 0.6;
    if (still && !stirring && t > settleUntil.current) return;

    // A breeze starts strong and fades over a couple of seconds.
    const breeze = Math.max(0, 1 - (t - gustAt.current) / 2);
    const px = (pointer.x * viewport.width) / 2;
    const py = (pointer.y * viewport.height) / 2;
    const arr = pts.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      let x = arr[ix];
      let y = arr[ix + 1];
      const s = seeds[i];

      x += dt * (0.9 + Math.sin(s) * 0.3) + dt * breeze * 3.2 * (0.7 + 0.3 * Math.sin(s * 3));
      y += dt * Math.sin(t * 0.8 + s) * 0.25 + dt * breeze * Math.sin(s * 7 + t * 3) * 1.1;

      // The pointer acts like a soft fan.
      const dx = x - px;
      const dy = y - py;
      const d2 = dx * dx + dy * dy;
      if (d2 < 2.2) {
        const f = (2.2 - d2) * dt * 2.2;
        const d = Math.sqrt(d2) || 1;
        x += (dx / d) * f;
        y += (dy / d) * f;
      }

      // Guide particles around the shield's outline.
      if (shieldOn) {
        const ex = (x - spot.x) / spot.rx;
        const ey = (y - spot.y) / spot.ry;
        const e = ex * ex + ey * ey;
        if (e < 1) {
          const k = 1 / Math.sqrt(e || 0.0001);
          x = spot.x + ex * k * spot.rx;
          y = spot.y + ey * k * spot.ry;
        }
      }

      if (x > halfW) {
        x = -halfW - Math.random() * 1.5;
        y = (Math.random() - 0.5) * halfH * 2;
      }
      if (y > halfH) y = -halfH;
      if (y < -halfH) y = halfH;
      arr[ix] = x;
      arr[ix + 1] = y;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={dot}
        size={0.16}
        vertexColors
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function ShieldModel({ visible, spot }: { visible: boolean; spot: ShieldSpot }) {
  const still = useReducedMotion();
  const shield = useShieldGeometry();
  const plus = usePlusGeometry();
  const ref = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const k = Math.min(1, delta * 4);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, -0.5 + pointer.x * 0.5, k);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -pointer.y * 0.3, k);
    const s = THREE.MathUtils.lerp(g.scale.x, visible ? spot.scale : 0.0001, Math.min(1, delta * 6));
    g.scale.setScalar(s);
  });

  return (
    <Float speed={still ? 0 : 1.2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={ref} position={[spot.x, spot.y, 0.5]}>
        <mesh geometry={shield}>
          <Glossy color={COLORS.sky} />
        </mesh>
        <mesh geometry={plus} position={[0, 0.02, 0.24]} scale={0.38}>
          <Glossy color={COLORS.white} iridescence={0.1} />
        </mesh>
      </group>
    </Float>
  );
}

// The shield sits to the right of the text on wide screens, and below it on
// phones.
function Lab({ shieldOn, gust }: { shieldOn: boolean; gust: number }) {
  const { viewport } = useThree();
  const wide = useMediaQuery("(min-width: 768px)");
  const spot = useMemo<ShieldSpot>(
    () =>
      wide
        ? { x: viewport.width * 0.2, y: 0, rx: 1.05, ry: 1.35, scale: 1.25 }
        : { x: 0, y: -viewport.height / 2 + 1.4, rx: 0.85, ry: 1.1, scale: 1 },
    [wide, viewport.width, viewport.height]
  );
  return (
    <>
      <Particles shieldOn={shieldOn} spot={spot} gust={gust} />
      <ShieldModel visible={shieldOn} spot={spot} />
    </>
  );
}

// Purely visual: the section around it explains what's happening in words,
// and its buttons do everything the pointer can.
export default function AerosolLab({
  className,
  shieldOn,
  gust,
}: {
  className?: string;
  shieldOn: boolean;
  gust: number;
}) {
  return (
    <SceneFrame className={className} camera={{ position: [0, 0, 8], fov: 40 }} keyboard={false} toggle={false}>
      <Studio intensity={1.2} />
      <Lab shieldOn={shieldOn} gust={gust} />
    </SceneFrame>
  );
}
