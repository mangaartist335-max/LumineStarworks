import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-radial-glow px-6 py-24 text-center">
      <Logo className="mb-10" wordmarkClassName="text-base" />
      <p className="text-sm font-medium text-accent">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        It may have been deleted, or you might not have access to it.
      </p>
      <ButtonLink href="/dashboard" className="mt-8">
        Back to dashboard
      </ButtonLink>
    </div>
  );
}
