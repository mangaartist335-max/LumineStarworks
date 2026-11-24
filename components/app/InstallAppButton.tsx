"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Smartphone } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { playSfx } from "@/lib/sfx";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function subscribeDisplayMode(callback: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** "Install app": the browser's install prompt where supported, otherwise simple steps. */
export function InstallAppButton() {
  const installed = useSyncExternalStore(subscribeDisplayMode, isInstalled, () => false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) return null;

  async function handleClick() {
    playSfx("tap");
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") playSfx("success");
      setPromptEvent(null);
      return;
    }
    setHelpOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
      >
        <Smartphone className="h-4 w-4" />
        Install app
      </button>
      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Install BuildBrief">
        <p className="text-sm text-muted">
          Add BuildBrief to your home screen and it opens full-screen with its own icon, just
          like an app.
        </p>
        <div className="mt-5 space-y-4 text-sm">
          <div>
            <p className="font-medium">iPhone or iPad (Safari)</p>
            <p className="mt-1 text-muted">
              Tap the <span className="font-medium text-foreground">Share</span> button, then{" "}
              <span className="font-medium text-foreground">Add to Home Screen</span>.
            </p>
          </div>
          <div>
            <p className="font-medium">Android (Chrome)</p>
            <p className="mt-1 text-muted">
              Tap the <span className="font-medium text-foreground">⋮</span> menu, then{" "}
              <span className="font-medium text-foreground">Install app</span> or{" "}
              <span className="font-medium text-foreground">Add to Home screen</span>.
            </p>
          </div>
          <div>
            <p className="font-medium">Computer (Chrome or Edge)</p>
            <p className="mt-1 text-muted">
              Click the install icon at the right end of the address bar, or open the browser
              menu and choose <span className="font-medium text-foreground">Install BuildBrief</span>.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
