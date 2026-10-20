"use client";

import { CircleCheck, LoaderCircle, Save, TriangleAlert } from "lucide-react";
import { useActionState, useRef } from "react";
import { saveRecordAction, type FormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { slugify } from "@/lib/archive/ids";
import { ENTITY_FORMS, type FieldDef, type Option } from "@/lib/archive/forms";
import type { EntityType } from "@/lib/archive/types";
import { cn } from "@/lib/utils";

export interface EntityFormProps {
  entity: EntityType;
  id?: string;
  values?: Record<string, string | string[] | boolean>;
  /** Hidden fields that the editor can't change here (e.g. the parent production). */
  fixed?: Record<string, string>;
  references?: Partial<Record<EntityType, Option[]>>;
  sources?: Option[];
  submitLabel?: string;
  /** For new top-level records: where to go after creating, with `{id}` as a placeholder. */
  redirectCreated?: string;
  /** Fields to leave out of this form. */
  omit?: string[];
  className?: string;
  warning?: string;
}

export function EntityForm(props: EntityFormProps) {
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await saveRecordAction(prev, formData);
    if (result.ok && result.message) toast(result.message);
    return result;
  }, {});
  // Remount after each successful save so "add" forms start fresh and edit forms pick up saved values.
  return <EntityFormInner key={state.ok ? state.savedAt : "form"} {...props} state={state} action={action} pending={pending} />;
}

function EntityFormInner({
  entity,
  id,
  values = {},
  fixed = {},
  references = {},
  sources = [],
  submitLabel,
  redirectCreated,
  omit = [],
  className,
  warning,
  state,
  action,
  pending,
}: EntityFormProps & { state: FormState; action: (formData: FormData) => void; pending: boolean }) {
  const slugRef = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(Boolean(values.slug));
  const fields = ENTITY_FORMS[entity].filter((f) => !omit.includes(f.name) && !(f.name in fixed));
  const formId = `${entity}-${id ?? "new"}`;

  // After a failed submit, show exactly what was sent (an absent checkbox means it was unticked).
  const current = (name: string): string | string[] | boolean | undefined => (state.values ? (state.values[name] ?? "") : values[name]);

  return (
    <form action={action} className={cn("space-y-5", className)} noValidate>
      <input type="hidden" name="__entity" value={entity} />
      {id && <input type="hidden" name="__id" value={id} />}
      {redirectCreated && <input type="hidden" name="__redirect_created" value={redirectCreated} />}
      {Object.entries(fixed).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      {warning && (
        <p className="flex gap-2 rounded-lg border border-prov-proposed/40 bg-prov-proposed/10 px-3 py-2 text-sm">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-prov-proposed" /> {warning}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <FieldControl
            key={field.name}
            field={field}
            formId={formId}
            value={current(field.name)}
            error={state.errors?.[field.name]}
            options={field.type === "reference" ? references[field.entity] ?? [] : undefined}
            slugRef={field.name === "slug" ? slugRef : undefined}
            onSlugInput={field.name === "slug" ? () => (slugTouched.current = true) : undefined}
            onTitleInput={
              (field.name === "title" || field.name === "name") && !id
                ? (text) => {
                    if (!slugTouched.current && slugRef.current) slugRef.current.value = slugify(text);
                  }
                : undefined
            }
          />
        ))}
      </div>

      {sources.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-dashed p-3">
          <label htmlFor={`${formId}-source`} className="text-xs font-medium text-muted-foreground">
            Source document for this change (optional)
          </label>
          <NativeSelect id={`${formId}-source`} name="__source" defaultValue="">
            <option value="">No citation</option>
            {sources.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
          <p className="text-xs text-muted-foreground">The changed fields will be cited to this document on the public record.</p>
        </div>
      )}

      {state.errors?._form && <p className="text-sm text-destructive">{state.errors._form}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircle aria-hidden className="animate-spin" /> : <Save aria-hidden />}
          {pending ? "Saving…" : (submitLabel ?? (id ? "Save changes" : "Add"))}
        </Button>
        <p aria-live="polite" className="text-sm">
          {state.error && <span className="text-destructive">{state.error}</span>}
          {state.ok && state.message && (
            <span className="inline-flex items-center gap-1.5 text-prov-confirmed">
              <CircleCheck aria-hidden className="size-4" /> {state.message}
            </span>
          )}
        </p>
      </div>
    </form>
  );
}

function FieldControl({
  field,
  formId,
  value,
  error,
  options,
  slugRef,
  onSlugInput,
  onTitleInput,
}: {
  field: FieldDef;
  formId: string;
  value: string | string[] | boolean | undefined;
  error?: string;
  options?: Option[];
  slugRef?: React.Ref<HTMLInputElement>;
  onSlugInput?: () => void;
  onTitleInput?: (text: string) => void;
}) {
  const id = `${formId}-${field.name}`;
  const describedBy = [field.help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const common = { id, name: field.name, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, required: field.required };
  const text = typeof value === "string" ? value : Array.isArray(value) ? value.join("\n") : "";
  const wide = field.wide || field.type === "textarea" || field.type === "multiselect";

  let control: React.ReactNode;
  switch (field.type) {
    case "textarea":
    case "list":
    case "dates":
      control = <Textarea {...common} defaultValue={text} rows={field.type === "textarea" ? 4 : 3} placeholder={"placeholder" in field ? field.placeholder : undefined} />;
      break;
    case "select":
    case "reference": {
      const list = field.type === "select" ? field.options : (options ?? []);
      control = (
        <NativeSelect {...common} defaultValue={text}>
          {(!field.required || !text) && <option value="">{field.empty ?? (field.required ? "Choose…" : "None")}</option>}
          {list.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      );
      break;
    }
    case "multiselect": {
      const selected = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
      control = (
        <fieldset aria-describedby={describedBy} className="flex flex-wrap gap-2">
          <legend className="sr-only">{field.label}</legend>
          {field.options.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-md border bg-background/60 px-2.5 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent">
              <input type="checkbox" name={field.name} value={o.value} defaultChecked={selected.includes(o.value)} className="size-4 accent-[var(--primary)]" />
              {o.label}
            </label>
          ))}
        </fieldset>
      );
      break;
    }
    case "checkbox":
      control = (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" id={id} name={field.name} defaultChecked={value === true || value === "on"} className="size-4 accent-[var(--primary)]" />
          {field.label}
        </label>
      );
      break;
    default:
      control = (
        <Input
          {...common}
          ref={slugRef}
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "url" ? "url" : "text"}
          step={field.type === "number" ? (field.step ?? 1) : undefined}
          inputMode={field.type === "time" ? "numeric" : undefined}
          pattern={field.type === "time" ? "[0-2][0-9]:[0-5][0-9]" : undefined}
          defaultValue={text}
          placeholder={"placeholder" in field ? field.placeholder : undefined}
          onInput={(e) => {
            onSlugInput?.();
            onTitleInput?.((e.target as HTMLInputElement).value);
          }}
          className={field.type === "date" || field.type === "time" || field.type === "number" ? "font-mono" : undefined}
        />
      );
  }

  return (
    <div className={cn("space-y-1.5", wide && "sm:col-span-2")}>
      {field.type !== "checkbox" && (
        <label htmlFor={id} className="text-sm font-medium">
          {field.label}
          {field.required && (
            <span aria-hidden className="ml-0.5 text-destructive">
              *
            </span>
          )}
        </label>
      )}
      {control}
      {field.help && (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {field.help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
