"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { useReducedMotion } from "./SceneFrame";

// Wraps a 3D object so it moves on its own, grows a little when you hover it,
// and does a happy spin when you click or tap it. By default it turns slowly
// all the way round; with `sway` it rocks gently from side to side instead,
// so flat shapes like medals keep facing you.
export function Interactive({
  children,
  speed = 0.25,
  sway,
  ...props
}: React.ComponentProps<"group"> & { speed?: number; sway?: number }) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();
  const turn = useRef(0);
  const spinTarget = useRef(0);
  const spin = useRef(0);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    spin.current = THREE.MathUtils.lerp(spin.current, spinTarget.current, Math.min(1, delta * 4));
    if (reduced) {
      g.rotation.y = spin.current;
    } else if (sway) {
      g.rotation.y = Math.sin(state.clock.elapsedTime * speed * 4) * sway + spin.current;
    } else {
      turn.current += delta * (hovered ? speed * 4 : speed);
      g.rotation.y = turn.current + spin.current;
    }
    const target = hovered ? 1.15 : 1;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, target, Math.min(1, delta * 8)));
  });

  return (
    <group {...props}>
      <group
        ref={ref}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          spinTarget.current += Math.PI * 2;
        }}
      >
        {children}
      </group>
    </group>
  );
}
