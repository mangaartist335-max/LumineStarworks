"use client";

import { Float, MeshTransmissionMaterial, PresentationControls, Sparkles } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Interactive } from "./Interactive";
import { SceneFrame, useMediaQuery, useReducedMotion } from "./SceneFrame";
import { COLORS, Glossy, useHeartGeometry, usePlusGeometry, useShieldGeometry } from "./shapes";
import { Studio } from "./Studio";

// What the glass bubble "sees" behind it: the hero's twilight blue.
const GLASS_BACKDROP = new THREE.Color("#4a7fb0");

// Camera rig: drifts with the pointer and slowly pushes in as you scroll, for
// a gentle cinematic feel.
function Rig() {
  useFrame(({ camera, pointer }, delta) => {
    const scroll = Math.min(1, window.scrollY / window.innerHeight);
    const k = Math.min(1, delta * 2.5);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.8, k);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.5 - scroll * 0.6, k);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 10 - scroll * 2.5, k);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Composition() {
  const { viewport } = useThree();
  const reduced = useReducedMotion();
  // On large screens the scene sits to the right of the headline; on smaller
  // ones it has its own band above the text, so it centres and fits.
  const wide = useMediaQuery("(min-width: 1024px)");
  const plus = usePlusGeometry();
  const heart = useHeartGeometry();
  const shield = useShieldGeometry();
  const floatSpeed = reduced ? 0 : 1.6;
  const fit = Math.min(1, (viewport.height * 0.86) / 4.9, (viewport.width * 0.9) / 5);

  return (
    <group
      position={wide ? [viewport.width * 0.21, 0.15, 0] : [0, 0.15, 0]}
      scale={wide ? Math.min(0.9, viewport.height / 6.8, viewport.width / 11) : fit}
    >
      <PresentationControls
        global
        snap
        speed={1.4}
        rotation={[0, -0.2, 0]}
        polar={[-0.35, 0.35]}
        azimuth={[-0.9, 0.9]}
      >
        {/* A glass "breath" bubble with a pearly pink core */}
        <Float speed={floatSpeed} rotationIntensity={0.4} floatIntensity={0.8}>
          <Interactive speed={0.12}>
            <mesh>
              <sphereGeometry args={[1.15, 64, 64]} />
              <MeshTransmissionMaterial
                samples={6}
                resolution={256}
                thickness={0.8}
                roughness={0.04}
                transmission={1}
                ior={1.25}
                chromaticAberration={0.08}
                anisotropy={0.2}
                distortion={0.15}
                distortionScale={0.4}
                temporalDistortion={0.1}
                color="#f3faff"
                background={GLASS_BACKDROP}
                backside
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.42, 48, 48]} />
              <Glossy color={COLORS.pink} iridescence={0.9} />
            </mesh>
          </Interactive>
        </Float>

        <Float speed={floatSpeed * 1.2} rotationIntensity={0.8} floatIntensity={1.2}>
          <Interactive position={[-1.75, 1.35, -0.4]} rotation={[0.2, 0.4, -0.15]} scale={0.72} sway={0.5}>
            <mesh geometry={shield}>
              <Glossy color={COLORS.sky} />
            </mesh>
            <mesh geometry={plus} position={[0, 0.02, 0.24]} scale={0.38}>
              <Glossy color={COLORS.white} iridescence={0.1} />
            </mesh>
          </Interactive>
        </Float>

        <Float speed={floatSpeed * 0.9} rotationIntensity={1} floatIntensity={1.4}>
          <Interactive position={[1.85, 1.3, 0.3]} rotation={[0.3, -0.5, 0.4]} scale={0.6} speed={0.35}>
            <mesh geometry={plus}>
              <Glossy color={COLORS.pink} />
            </mesh>
          </Interactive>
        </Float>

        <Float speed={floatSpeed * 1.1} rotationIntensity={0.6} floatIntensity={1}>
          <Interactive position={[1.55, -1.35, 0.7]} rotation={[0.1, -0.3, 0.1]} scale={0.95} sway={0.45}>
            <mesh geometry={heart}>
              <Glossy color={COLORS.hotPink} iridescence={0.5} />
            </mesh>
          </Interactive>
        </Float>

        <Float speed={floatSpeed} rotationIntensity={1.2} floatIntensity={1.1}>
          <Interactive position={[-1.5, -1.35, 0.3]} rotation={[1.1, 0.3, 0]} speed={0.4}>
            <mesh>
              <torusGeometry args={[0.48, 0.17, 48, 128]} />
              <Glossy color={COLORS.skyDeep} iridescence={0.8} />
            </mesh>
          </Interactive>
        </Float>

        <Float speed={floatSpeed * 1.3} rotationIntensity={1.4} floatIntensity={1.6}>
          <Interactive position={[0.2, -2.25, -0.8]} rotation={[0, 0, 1]} scale={0.8} speed={0.5}>
            <mesh>
              <capsuleGeometry args={[0.2, 0.55, 12, 32]} />
              <Glossy color={COLORS.pearl} iridescence={1} />
            </mesh>
          </Interactive>
        </Float>
      </PresentationControls>

      {/* Drifting "aerosol" particles */}
      <Sparkles count={70} scale={[9, 6, 4]} size={3.2} speed={reduced ? 0 : 0.35} color={COLORS.sky} opacity={0.9} />
      <Sparkles count={45} scale={[9, 6, 4]} size={2.6} speed={reduced ? 0 : 0.3} color={COLORS.pink} opacity={0.9} />
    </group>
  );
}

export default function HeroScene({ className }: { className?: string }) {
  return (
    <SceneFrame className={className} camera={{ position: [0, 0, 10], fov: 35 }}>
      <Studio />
      <Composition />
      <Rig />
    </SceneFrame>
  );
}
