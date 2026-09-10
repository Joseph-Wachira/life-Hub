"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { switchWorkspaceAction, createWorkspaceAction } from "@/lib/actions/workspace";
import type { ActionResult } from "@/lib/actions/auth";
import { WORKSPACE_TYPE_META, WORKSPACE_TYPE_ORDER } from "@/lib/constants/workspaces";
import { useWorkspace } from "./workspace-context";
import { cn } from "@/lib/utils";

function CreateSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create workspace"}
    </Button>
  );
}

export function WorkspaceSwitcher() {
  const { workspace, workspaces } = useWorkspace();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [type, setType] = useState<(typeof WORKSPACE_TYPE_ORDER)[number]>("PERSONAL");
  const [state, formAction] = useActionState<ActionResult | null, FormData>(createWorkspaceAction, null);

  const ActiveIcon = WORKSPACE_TYPE_META[workspace.type].icon;

  function handleSwitch(id: string) {
    if (id === workspace.id) return;
    const fd = new FormData();
    fd.set("workspaceId", id);
    startTransition(() => {
      switchWorkspaceAction(fd);
    });
  }

  useEffect(() => {
    if (state && "success" in state) {
      setDialogOpen(false);
    }
  }, [state]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex w-full items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-sm shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--surface-sunken)] disabled:opacity-60"
            disabled={isPending}
          >
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-white"
              style={{ backgroundColor: workspace.color }}
            >
              <ActiveIcon className="size-3.5" />
            </span>
            <span className="flex-1 truncate font-medium">{workspace.name}</span>
            <ChevronsUpDown className="size-4 shrink-0 text-[var(--subtle-foreground)]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((w) => {
            const Icon = WORKSPACE_TYPE_META[w.type].icon;
            return (
              <DropdownMenuItem key={w.id} onSelect={() => handleSwitch(w.id)}>
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-white"
                  style={{ backgroundColor: w.color }}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="flex-1 truncate">{w.name}</span>
                {w.id === workspace.id && <Check className="size-4 text-[var(--brand)]" />}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            New workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New workspace</DialogTitle>
            <DialogDescription>
              Separate a new area of your life — Work, School, Family, and more.
            </DialogDescription>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workspace-name">Name</Label>
              <Input id="workspace-name" name="name" placeholder="e.g. Freelance clients" required autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {WORKSPACE_TYPE_ORDER.map((t) => {
                  const meta = WORKSPACE_TYPE_META[t];
                  const Icon = meta.icon;
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setType(t)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-[var(--radius-md)] border px-2 py-2.5 text-xs transition-colors",
                        type === t
                          ? "border-[var(--brand)] bg-[var(--brand-muted)] text-[var(--brand)]"
                          : "border-[var(--border)] hover:border-[var(--border-strong)]"
                      )}
                    >
                      <Icon className="size-4" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="type" value={type} />
            </div>
            {state && "error" in state && (
              <p role="alert" className="text-sm text-[var(--danger)]">
                {state.error}
              </p>
            )}
            <DialogFooter>
              <CreateSubmitButton />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
