"use client";

import dynamic from "next/dynamic";

// The whole computer runs in the browser (IndexedDB is its hard drive), so it
// renders on the client only.
const Computer = dynamic(() => import("@/components/desktop/Computer"), {
  ssr: false,
  loading: () => <div className="boot-screen" aria-label="Starting" />,
});

export default function Page() {
  return <Computer />;
}
