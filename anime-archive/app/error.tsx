"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-page grid min-h-[50vh] place-items-center py-20 text-center">
      <div className="max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">The archive hit a snag</h1>
        <p className="text-muted-foreground">
          Something went wrong while loading this page. If the archive is connected to Supabase, check that the migration has been applied and the
          environment variables are set.
        </p>
        {error.digest && <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
        <Button onClick={reset}>
          <RefreshCw aria-hidden /> Try again
        </Button>
      </div>
    </div>
  );
}
