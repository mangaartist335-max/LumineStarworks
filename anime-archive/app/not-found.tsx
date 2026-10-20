import { Compass } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative grid min-h-[60vh] place-items-center overflow-hidden px-4 py-20 text-center">
      <div aria-hidden className="starfield absolute inset-0 opacity-70" />
      <div className="relative max-w-md space-y-4">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
          <Compass aria-hidden className="size-6" />
        </span>
        <h1 className="text-2xl font-bold">This page drifted out of the archive</h1>
        <p className="text-muted-foreground">We couldn&apos;t find that record. It may have a new address, or it hasn&apos;t been added yet.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/">Back to the archive</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search">Search instead</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
