"use client";

import { Float, PresentationControls } from "@react-three/drei";
import { Interactive } from "./Interactive";
import { SceneFrame, useReducedMotion } from "./SceneFrame";
import { COLORS, Glossy, useHeartGeometry } from "./shapes";
import { Studio } from "./Studio";

function MedalModel() {
  const reduced = useReducedMotion();
  const heart = useHeartGeometry();
  return (
    <PresentationControls global snap speed={1.6} polar={[-0.4, 0.4]} azimuth={[-1.4, 1.4]}>
      <Float speed={reduced ? 0 : 1.6} rotationIntensity={0.4} floatIntensity={0.6}>
        <Interactive speed={0.3} sway={0.55}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1, 1, 0.22, 96]} />
            <Glossy color={COLORS.pink} iridescence={0.7} />
          </mesh>
          <mesh>
            <torusGeometry args={[1.02, 0.11, 32, 128]} />
            <Glossy color={COLORS.skyDeep} iridescence={0.9} />
          </mesh>
          <mesh geometry={heart} position={[0, 0.05, 0.16]} scale={0.6}>
            <Glossy color={COLORS.white} iridescence={0.2} />
          </mesh>
          <mesh geometry={heart} position={[0, 0.05, -0.16]} rotation={[0, Math.PI, 0]} scale={0.6}>
            <Glossy color={COLORS.white} iridescence={0.2} />
          </mesh>
        </Interactive>
      </Float>
    </PresentationControls>
  );
}

export default function Medal({ className }: { className?: string }) {
  return (
    <SceneFrame className={className} camera={{ position: [0, 0, 4.4], fov: 35 }}>
      <Studio />
      <MedalModel />
    </SceneFrame>
  );
}
