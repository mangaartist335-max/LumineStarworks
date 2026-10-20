import { LogoMark } from "@/components/logo";

export function AuthCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-[70vh] place-items-center overflow-hidden px-4 py-16">
      <div aria-hidden className="starfield absolute inset-0 opacity-70" />
      <div aria-hidden className="absolute top-10 size-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative w-full max-w-sm space-y-6 rounded-2xl border bg-card/80 p-7 shadow-2xl backdrop-blur">
        <div className="space-y-2 text-center">
          <LogoMark className="mx-auto size-10" />
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
