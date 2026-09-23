"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input, Textarea, Select, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { BuildPlan, TechStack } from "@/lib/types";

type FieldConfig<T> = {
  key: keyof T & string;
  label: string;
  type: "text" | "textarea" | "select" | "list";
  options?: string[];
};

function ItemCard({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="relative rounded-lg border border-border bg-background-elevated p-4 pr-11">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-danger/10 hover:text-danger"
        aria-label="Remove"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ObjectListEditor<T extends object>({
  items,
  onChange,
  fields,
  emptyItem,
  addLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  fields: FieldConfig<T>[];
  emptyItem: () => T;
  addLabel: string;
}) {
  function updateItem(index: number, key: keyof T & string, value: unknown) {
    const next = items.slice();
    next[index] = { ...next[index], [key]: value } as T;
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <ItemCard key={index} onRemove={() => onChange(items.filter((_, i) => i !== index))}>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.key}
                className={field.type === "textarea" ? "sm:col-span-2" : undefined}
              >
                <Label>{field.label}</Label>
                {field.type === "select" ? (
                  <Select
                    value={String(item[field.key] ?? "")}
                    onChange={(e) => updateItem(index, field.key, e.target.value)}
                  >
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                ) : field.type === "textarea" ? (
                  <Textarea
                    rows={2}
                    value={String(item[field.key] ?? "")}
                    onChange={(e) => updateItem(index, field.key, e.target.value)}
                  />
                ) : field.type === "list" ? (
                  <Input
                    value={
                      Array.isArray(item[field.key])
                        ? (item[field.key] as string[]).join(", ")
                        : ""
                    }
                    placeholder="Comma-separated"
                    onChange={(e) =>
                      updateItem(
                        index,
                        field.key,
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                      )
                    }
                  />
                ) : (
                  <Input
                    value={String(item[field.key] ?? "")}
                    onChange={(e) => updateItem(index, field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </ItemCard>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...items, emptyItem()])}
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}

export function StringListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <Textarea
      rows={Math.max(4, items.length + 1)}
      value={items.join("\n")}
      onChange={(e) => onChange(e.target.value.split("\n"))}
      placeholder={placeholder || "One item per line"}
    />
  );
}

const BUILD_PLAN_BLOCKS: { key: keyof BuildPlan; label: string }[] = [
  { key: "dayOneMorning", label: "Day 1 — Morning" },
  { key: "dayOneAfternoon", label: "Day 1 — Afternoon" },
  { key: "dayOneEvening", label: "Day 1 — Evening" },
  { key: "dayTwoMorning", label: "Day 2 — Morning" },
  { key: "dayTwoAfternoon", label: "Day 2 — Afternoon" },
  { key: "dayTwoFinalPolish", label: "Day 2 — Final Polish" },
];

export function BuildPlanEditor({
  plan,
  onChange,
}: {
  plan: BuildPlan;
  onChange: (plan: BuildPlan) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {BUILD_PLAN_BLOCKS.map((block) => (
        <div key={block.key}>
          <Label>{block.label}</Label>
          <StringListEditor
            items={plan[block.key]}
            onChange={(items) => onChange({ ...plan, [block.key]: items })}
          />
        </div>
      ))}
    </div>
  );
}

const TECH_STACK_FIELDS: { key: keyof TechStack; label: string }[] = [
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "database", label: "Database" },
  { key: "authentication", label: "Authentication" },
  { key: "hosting", label: "Hosting" },
  { key: "aiServices", label: "AI / Services" },
];

export function TechStackEditor({
  stack,
  onChange,
}: {
  stack: TechStack;
  onChange: (stack: TechStack) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {TECH_STACK_FIELDS.map((field) => (
        <div key={field.key}>
          <Label>{field.label}</Label>
          <Input
            value={stack[field.key] ?? ""}
            onChange={(e) => onChange({ ...stack, [field.key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}
