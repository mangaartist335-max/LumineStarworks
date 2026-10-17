"use client";

import { Float, PresentationControls, Sparkles } from "@react-three/drei";
import type { CourseIcon, CoverTheme } from "@/lib/courses";
import { Interactive } from "./Interactive";
import { KeyRig, SceneFrame, useReducedMotion } from "./SceneFrame";
import { COLORS, Glossy, useHeartGeometry, usePlusGeometry, useShieldGeometry } from "./shapes";
import { Studio } from "./Studio";

const THEME_COLORS: Record<CoverTheme, [string, string]> = {
  sky: [COLORS.sky, COLORS.pink],
  pink: [COLORS.hotPink, COLORS.sky],
  blend: [COLORS.skyDeep, COLORS.hotPink],
  periwinkle: ["#a9b8f0", COLORS.pink],
  aqua: [COLORS.skyDeep, COLORS.pearl],
  rose: [COLORS.hotPink, COLORS.sky],
};

function Hero3D({ icon, theme }: { icon: CourseIcon; theme: CoverTheme }) {
  const reduced = useReducedMotion();
  const plus = usePlusGeometry();
  const heart = useHeartGeometry();
  const shield = useShieldGeometry();
  const [main, second] = THEME_COLORS[theme];

  const body =
    icon === "shield" || icon === "wind" || icon === "clipboard" ? (
      <>
        <mesh geometry={shield}>
          <Glossy color={main} />
        </mesh>
        <mesh geometry={plus} position={[0, 0.02, 0.24]} scale={0.38}>
          <Glossy color={COLORS.white} iridescence={0.1} />
        </mesh>
      </>
    ) : icon === "heart-pulse" || icon === "leaf" ? (
      <mesh geometry={heart} scale={1.15}>
        <Glossy color={main} iridescence={0.5} />
      </mesh>
    ) : (
      <mesh geometry={plus} scale={1.1}>
        <Glossy color={main} />
      </mesh>
    );

  return (
    <KeyRig>
    <PresentationControls global snap speed={1.5} polar={[-0.4, 0.4]} azimuth={[-1.2, 1.2]}>
      <Float speed={reduced ? 0 : 1.5} rotationIntensity={0.5} floatIntensity={0.8}>
        <Interactive speed={0.3} sway={0.6}>{body}</Interactive>
      </Float>
      <Float speed={reduced ? 0 : 2} floatIntensity={1.5}>
        <mesh position={[1.6, 0.9, -0.6]}>
          <sphereGeometry args={[0.38, 48, 48]} />
          <Glossy color={COLORS.pearl} iridescence={1} />
        </mesh>
        <mesh position={[-1.7, -0.8, -0.3]}>
          <sphereGeometry args={[0.24, 32, 32]} />
          <Glossy color={second} iridescence={0.9} />
        </mesh>
      </Float>
      <Sparkles count={30} scale={[5, 3, 2]} size={3} speed={reduced ? 0 : 0.4} color={COLORS.white} />
    </PresentationControls>
    </KeyRig>
  );
}

function shapeName(icon: CourseIcon) {
  if (icon === "shield" || icon === "wind" || icon === "clipboard") return "a shield with a white cross";
  if (icon === "heart-pulse" || icon === "leaf") return "a glossy heart";
  return "a rounded plus sign";
}

export default function CourseObject({
  icon,
  theme,
  className,
  courseTitle,
}: {
  icon: CourseIcon;
  theme: CoverTheme;
  className?: string;
  courseTitle?: string;
}) {
  return (
    <SceneFrame
      className={className}
      camera={{ position: [0, 0, 6], fov: 35 }}
      label={`3D model for ${courseTitle ?? "this course"}: ${shapeName(icon)} with two small floating beads`}
      toggleClassName="bottom-3 right-3"
    >
      <Studio />
      <Hero3D icon={icon} theme={theme} />
    </SceneFrame>
  );
}
