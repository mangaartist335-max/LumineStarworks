"use client";

import { CircleCheck, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import type { FormState } from "@/app/admin/actions";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

/**
 * A small form that runs one Server Action — restore, approve, resolve, delete…
 * Hidden fields carry the ids; an optional confirm prompt guards destructive steps.
 */
export function ActionForm({
  action,
  fields,
  label,
  pendingLabel = "Working…",
  confirm,
  variant = "outline",
  size = "sm",
  icon,
  children,
  className,
  inline = true,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: Record<string, string | string[]>;
  label: string;
  pendingLabel?: string;
  confirm?: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  inline?: boolean;
}) {
  const [state, run, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    // The row this form belongs to may disappear after a successful action, so confirm with a toast too.
    if (result.ok && result.message) toast(result.message);
    return result;
  }, {});
  return (
    <form
      action={run}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={cn(inline ? "inline-flex flex-wrap items-center gap-2" : "space-y-2", className)}
    >
      {Object.entries(fields).flatMap(([name, value]) =>
        (Array.isArray(value) ? value : [value]).map((v, i) => <input key={`${name}-${i}`} type="hidden" name={name} value={v} />),
      )}
      {children}
      <Button type="submit" variant={variant} size={size} disabled={pending}>
        {pending ? <LoaderCircle aria-hidden className="animate-spin" /> : icon}
        {pending ? pendingLabel : label}
      </Button>
      <span aria-live="polite" className="text-xs">
        {state.error && <span className="text-destructive">{state.error}</span>}
        {state.ok && state.message && (
          <span className="inline-flex items-center gap-1 text-prov-confirmed">
            <CircleCheck aria-hidden className="size-3.5" /> {state.message}
          </span>
        )}
      </span>
    </form>
  );
}
