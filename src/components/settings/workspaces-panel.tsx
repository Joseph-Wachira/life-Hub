"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Pencil, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteWorkspaceAction, setDefaultWorkspaceAction, updateWorkspaceAction } from "@/lib/actions/workspace";
import type { ActionResult } from "@/lib/actions/auth";
import { WORKSPACE_TYPE_META } from "@/lib/constants/workspaces";
import { cn } from "@/lib/utils";
import type { Workspace } from "@prisma/client";

const COLOR_SWATCHES = [
  "#6366f1",
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
  "#22c55e",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#64748b",
];

function EditSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Deleting…" : "Delete workspace"}
    </Button>
  );
}

function EditWorkspaceDialog({
  workspace,
  open,
  onOpenChange,
}: {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(updateWorkspaceAction, null);
  const [color, setColor] = useState(workspace.color);

  useEffect(() => {
    if (state && "success" in state) {
      toast.success("Workspace updated");
      onOpenChange(false);
    }
    if (state && "error" in state) toast.error(state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit workspace</DialogTitle>
          <DialogDescription>Rename this workspace or change its color.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="workspaceId" value={workspace.id} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`name-${workspace.id}`}>Name</Label>
            <Input id={`name-${workspace.id}`} name="name" defaultValue={workspace.name} required autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform",
                    color === c ? "scale-110 border-[var(--foreground)]" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Choose color ${c}`}
                  aria-pressed={color === c}
                />
              ))}
            </div>
            <input type="hidden" name="color" value={color} />
          </div>
          {state && "error" in state && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <EditSubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteWorkspaceDialog({
  workspace,
  open,
  onOpenChange,
}: {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(deleteWorkspaceAction, null);

  useEffect(() => {
    if (state && "success" in state) {
      toast.success("Workspace deleted");
      onOpenChange(false);
    }
    if (state && "error" in state) toast.error(state.error);
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{workspace.name}&rdquo;?</DialogTitle>
          <DialogDescription>
            This permanently deletes this workspace and everything in it — tasks, events, notes, projects,
            and more. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="workspaceId" value={workspace.id} />
          {state && "error" in state && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <DeleteSubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function WorkspacesPanel({ workspaces }: { workspaces: Workspace[] }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Workspace | null>(null);
  const [deleting, setDeleting] = useState<Workspace | null>(null);

  function handleSetDefault(workspaceId: string) {
    const fd = new FormData();
    fd.set("workspaceId", workspaceId);
    startTransition(() => {
      setDefaultWorkspaceAction(fd);
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Workspaces</CardTitle>
          <CardDescription>
            Separate areas of your life — each with its own tasks, calendar, and data.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {workspaces.map((w) => {
            const meta = WORKSPACE_TYPE_META[w.type];
            const Icon = meta.icon;
            const canDelete = !w.isDefault && workspaces.length > 1;
            return (
              <div
                key={w.id}
                className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-white"
                    style={{ backgroundColor: w.color }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2 font-medium">
                      {w.name}
                      {w.isDefault && <Badge>Default</Badge>}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">{meta.label}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!w.isDefault && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleSetDefault(w.id)}
                    >
                      <Star className="size-3.5" />
                      Make default
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(w)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canDelete}
                    onClick={() => setDeleting(w)}
                    title={
                      !canDelete
                        ? "Make another workspace the default first, or this is your only workspace"
                        : undefined
                    }
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {editing && (
        <EditWorkspaceDialog workspace={editing} open={!!editing} onOpenChange={(open) => !open && setEditing(null)} />
      )}
      {deleting && (
        <DeleteWorkspaceDialog
          workspace={deleting}
          open={!!deleting}
          onOpenChange={(open) => !open && setDeleting(null)}
        />
      )}
    </>
  );
}
