"use client";

import { useActionState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { updateDisplayNameAction, type SettingsActionState } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

const initialState: SettingsActionState = { error: null, success: false };

export function DisplayNameForm({ displayName }: { displayName: string }) {
  const [state, formAction, pending] = useActionState(
    updateDisplayNameAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          maxLength={80}
        />
      </div>
      {state.error && (
        <div className="flex items-center gap-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4" />
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="flex items-center gap-2 text-sm text-success">
          <Check className="h-4 w-4" />
          Saved.
        </div>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
