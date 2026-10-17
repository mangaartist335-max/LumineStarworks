"use client";

import { useMemo } from "react";
import * as THREE from "three";

// Procedural shapes for the 3D scenes: a rounded medical plus, a heart and a
// shield, all extruded with soft bevels so they catch the light nicely.

function extrude(shape: THREE.Shape, depth: number, bevel: number) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 10,
    curveSegments: 40,
  });
  g.center();
  return g;
}

// Builds a closed shape through the given corners, rounding each corner.
function roundedPolygon(points: [number, number][], radius: number) {
  const shape = new THREE.Shape();
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const [px, py] = points[(i - 1 + n) % n];
    const [cx, cy] = points[i];
    const [nx, ny] = points[(i + 1) % n];
    const inLen = Math.hypot(cx - px, cy - py);
    const outLen = Math.hypot(nx - cx, ny - cy);
    const r = Math.min(radius, inLen / 2, outLen / 2);
    const ax = cx + ((px - cx) / inLen) * r;
    const ay = cy + ((py - cy) / inLen) * r;
    const bx = cx + ((nx - cx) / outLen) * r;
    const by = cy + ((ny - cy) / outLen) * r;
    if (i === 0) shape.moveTo(ax, ay);
    else shape.lineTo(ax, ay);
    shape.quadraticCurveTo(cx, cy, bx, by);
  }
  shape.closePath();
  return shape;
}

export function usePlusGeometry() {
  return useMemo(() => {
    const a = 0.3;
    const l = 0.95;
    const pts: [number, number][] = [
      [-a, l], [a, l], [a, a], [l, a], [l, -a], [a, -a],
      [a, -l], [-a, -l], [-a, -a], [-l, -a], [-l, a], [-a, a],
    ];
    return extrude(roundedPolygon(pts, 0.12), 0.32, 0.08);
  }, []);
}

export function useHeartGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(25, 25);
    s.bezierCurveTo(25, 25, 20, 0, 0, 0);
    s.bezierCurveTo(-30, 0, -30, 35, -30, 35);
    s.bezierCurveTo(-30, 55, -10, 77, 25, 95);
    s.bezierCurveTo(60, 77, 80, 55, 80, 35);
    s.bezierCurveTo(80, 35, 80, 0, 50, 0);
    s.bezierCurveTo(35, 0, 25, 25, 25, 25);
    const g = extrude(s, 22, 8);
    g.scale(0.014, 0.014, 0.014);
    g.rotateZ(Math.PI);
    return g;
  }, []);
}

export function useShieldGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 1.0);
    s.bezierCurveTo(0.35, 0.86, 0.7, 0.86, 0.92, 0.86);
    s.bezierCurveTo(0.92, 0.0, 0.72, -0.62, 0, -1.08);
    s.bezierCurveTo(-0.72, -0.62, -0.92, 0.0, -0.92, 0.86);
    s.bezierCurveTo(-0.7, 0.86, -0.35, 0.86, 0, 1.0);
    return extrude(s, 0.28, 0.08);
  }, []);
}

export const COLORS = {
  sky: "#8fd0f3",
  skyDeep: "#5bb8ea",
  pink: "#f7a8e2",
  hotPink: "#ec5fbf",
  pearl: "#fdf4fb",
  white: "#ffffff",
};

// Glossy, slightly pearly plastic used for most of the objects.
export function Glossy({ color, iridescence = 0.35 }: { color: string; iridescence?: number }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={0.18}
      metalness={0.05}
      clearcoat={1}
      clearcoatRoughness={0.08}
      iridescence={iridescence}
      iridescenceIOR={1.3}
      sheen={0.4}
      sheenColor="#ffffff"
    />
  );
}
