"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Download,
  Hammer,
  Loader2,
  Monitor,
  RotateCw,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePollForApp } from "@/lib/usePollForApp";
import { downloadTextFile } from "@/lib/markdown";
import { cn, slugify } from "@/lib/utils";
import type { ProjectRow } from "@/lib/types";
import { playSfx } from "@/lib/sfx";

const BUILD_STEPS = [
  "Reading your blueprint…",
  "Sketching the screens…",
  "Picking colours and layout…",
  "Wiring up the features…",
  "Adding sample data…",
  "Polishing the details…",
  "Almost there…",
];

// The built app is untrusted generated code. It runs in an iframe sandbox
// WITHOUT allow-same-origin, so it gets an opaque origin: it can't read
// BuildBrief's cookies, storage or session, or reach into this page.
const SANDBOX = "allow-scripts allow-forms allow-modals allow-pointer-lock";

type Device = "phone" | "desktop";

export function AppBuilderModal({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  project: ProjectRow;
}) {
  const { polling, start, stop } = usePollForApp();
  const [html, setHtml] = useState<string | null>(project.app_html);
  const [error, setError] = useState<string | null>(
    project.app_status === "failed" ? project.app_error : null
  );
  const [isBuilding, setIsBuilding] = useState(project.app_status === "building");
  const [starting, setStarting] = useState(false);
  const [device, setDevice] = useState<Device>(
    project.project_type === "Mobile App" ? "phone" : "desktop"
  );
  const [previewKey, setPreviewKey] = useState(0);

  const watch = useCallback(() => {
    start(project.id, {
      onDone: (built) => {
        playSfx("fanfare");
        setHtml(built);
        setError(null);
        setIsBuilding(false);
        setPreviewKey((k) => k + 1);
      },
      onFailed: (message) => {
        playSfx("error");
        setError(message);
        setIsBuilding(false);
      },
    });
  }, [project.id, start]);

  // Pick up a build that's already running whenever the window opens.
  useEffect(() => {
    if (open && isBuilding && !polling) watch();
  }, [open, isBuilding, polling, watch]);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  async function handleBuild() {
    setStarting(true);
    setError(null);
    playSfx("start");
    try {
      const res = await fetch(`/api/projects/${project.id}/build-app`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't start the build. Please try again.");
      setIsBuilding(true);
      watch();
    } catch (err) {
      playSfx("error");
      setError(err instanceof Error ? err.message : "Couldn't start the build. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  function handleDownload() {
    if (!html) return;
    playSfx("success");
    downloadTextFile(`${slugify(project.name) || "app"}.html`, html, "text/html");
  }

  if (!open || typeof document === "undefined") return null;

  const showPreview = !!html && !isBuilding;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-border-strong bg-surface shadow-2xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
          <div className="mr-auto flex min-w-0 items-center gap-2">
            <Hammer className="h-4 w-4 shrink-0 text-accent" />
            <h2 className="truncate text-base font-semibold">Build App · {project.name}</h2>
          </div>

          {showPreview && (
            <>
              <div className="flex rounded-lg border border-border p-0.5">
                <DeviceButton active={device === "phone"} onClick={() => setDevice("phone")} label="Phone">
                  <Smartphone className="h-4 w-4" />
                </DeviceButton>
                <DeviceButton active={device === "desktop"} onClick={() => setDevice("desktop")} label="Desktop">
                  <Monitor className="h-4 w-4" />
                </DeviceButton>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewKey((k) => k + 1)} title="Restart the app">
                <RotateCw className="h-4 w-4" />
                <span className="hidden sm:inline">Restart</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button size="sm" onClick={handleBuild} disabled={starting}>
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Rebuild
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-hover hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && showPreview && <ErrorBox message={error} className="mx-4 mt-3 sm:mx-5" />}

        <div className="relative min-h-0 flex-1 bg-background">
          {isBuilding ? (
            <BuildingState />
          ) : showPreview ? (
            <div className="flex h-full items-center justify-center p-3 sm:p-5">
              <div
                className={cn(
                  "h-full overflow-hidden bg-white shadow-xl",
                  device === "phone"
                    ? "aspect-[9/19] max-w-full rounded-[2rem] border-[6px] border-neutral-800"
                    : "w-full rounded-lg border border-border"
                )}
              >
                <iframe
                  key={previewKey}
                  title={`${project.name} app preview`}
                  srcDoc={html ?? ""}
                  sandbox={SANDBOX}
                  referrerPolicy="no-referrer"
                  className="h-full w-full border-0 bg-white"
                />
              </div>
            </div>
          ) : (
            <IdleState
              projectName={project.name}
              error={error}
              starting={starting}
              onBuild={handleBuild}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function DeviceButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex h-7 w-8 items-center justify-center rounded-md transition-colors",
        active ? "bg-surface-hover text-foreground" : "text-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ErrorBox({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-left text-sm text-danger",
        className
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function IdleState({
  projectName,
  error,
  starting,
  onBuild,
}: {
  projectName: string;
  error: string | null;
  starting: boolean;
  onBuild: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl accent-gradient text-white">
        <Hammer className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold sm:text-2xl">
        {error ? "Let's give it another go" : `Turn ${projectName} into a working app`}
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted">
        BuildBrief builds a real, clickable version of your idea from this blueprint. Try it
        right here, then download it as a single file that opens in any browser.
      </p>
      <ul className="mt-5 space-y-1.5 text-left text-sm text-muted">
        <li>✨ Your MVP features, working for real</li>
        <li>🎨 A polished design with sample data</li>
        <li>📦 One file you can share or keep building on</li>
      </ul>
      {error && <ErrorBox message={error} className="mt-6 max-w-md" />}
      <Button size="lg" className="mt-7" onClick={onBuild} disabled={starting}>
        {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {error ? "Try again" : "Build my app"}
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">Takes about a minute or two.</p>
    </div>
  );
}

function BuildingState() {
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const startedRef = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      if (startedRef.current === null) startedRef.current = Date.now();
      const elapsed = Math.floor((Date.now() - startedRef.current) / 1000);
      setSeconds(elapsed);
      setStep(Math.min(Math.floor(elapsed / 12), BUILD_STEPS.length - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border-strong bg-surface">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
      <p key={step} className="animate-fade-up text-base font-medium text-foreground">
        {BUILD_STEPS[step]}
      </p>
      <div className="mt-5 h-1.5 w-64 overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full rounded-full accent-gradient transition-all duration-1000"
          style={{ width: `${Math.min(95, 8 + seconds * 0.8)}%` }}
        />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Building your app usually takes a minute or two. You can close this window: the build
        keeps going and will be here when you come back.
      </p>
    </div>
  );
}
