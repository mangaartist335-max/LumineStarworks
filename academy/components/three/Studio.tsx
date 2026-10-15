"use client";

import { Environment, Lightformer } from "@react-three/drei";

// Studio lighting built from local light panels (no downloaded HDRs), tinted
// with the Academy's sky blue and pink for soft colored reflections.
export function Studio({ intensity = 1 }: { intensity?: number }) {
  return (
    <>
      <ambientLight intensity={0.35 * intensity} />
      <directionalLight position={[4, 6, 5]} intensity={1.4 * intensity} color="#ffffff" />
      <pointLight position={[-5, -2, 3]} intensity={30 * intensity} color="#8fd0f3" />
      <pointLight position={[5, -3, 2]} intensity={24 * intensity} color="#f7a8e2" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, 4, -6]} scale={[12, 3, 1]} />
        <Lightformer form="rect" intensity={2.5} color="#8fd0f3" position={[-6, 0, -2]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={2.5} color="#f7a8e2" position={[6, 0, -2]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="circle" intensity={4} color="#ffffff" position={[0, 0, 8]} scale={3} />
      </Environment>
    </>
  );
}
