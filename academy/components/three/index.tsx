"use client";

import dynamic from "next/dynamic";

// The 3D scenes only run in the browser, so they load on the client after the
// page itself has rendered.
export const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });
export const CourseObject = dynamic(() => import("./CourseObject"), { ssr: false });
export const Medal = dynamic(() => import("./Medal"), { ssr: false });
export { AerosolLabSection } from "./AerosolLabSection";
