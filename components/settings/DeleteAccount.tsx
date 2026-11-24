"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { deleteAccountAction } from "@/app/(app)/settings/actions";

export function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    const result = await deleteAccountAction();
    if (result.error) {
      setError(result.error);
      setBusy(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Delete account
      </Button>
      <Modal open={open} onClose={() => !busy && setOpen(false)} title="Delete your account?">
        <p className="text-sm text-muted">
          This permanently deletes your account and all of your projects, plans and built apps,
          on the website and in the mobile app. It can&apos;t be undone.
        </p>
        <label className="mt-5 block text-sm font-medium" htmlFor="confirm-delete">
          Type <span className="font-mono">DELETE</span> to confirm
        </label>
        <input
          id="confirm-delete"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-background-elevated px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={busy || confirmText !== "DELETE"}>
            {busy ? "Deleting…" : "Delete forever"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
