"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { ChevronRight, Folder, Pin, Plus, StickyNote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createFolderAction, deleteFolderAction } from "@/lib/actions/notes";
import type { ActionResult } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export interface FolderNode {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
}

function buildTree(folders: FolderNode[], parentId: string | null): (FolderNode & { children: FolderNode[] })[] {
  return folders
    .filter((f) => f.parentId === parentId)
    .map((f) => ({ ...f, children: buildTree(folders, f.id) as unknown as FolderNode[] }));
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create folder"}
    </Button>
  );
}

function NewFolderDialog({ parentId }: { parentId?: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(createFolderAction, null);

  useEffect(() => {
    if (state && "success" in state) setOpen(false);
  }, [state]);

  return (
    <>
      <Button variant="ghost" size="icon" className="size-6" onClick={() => setOpen(true)} aria-label="New folder">
        <Plus className="size-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            {parentId && <input type="hidden" name="parentId" value={parentId} />}
            <Input name="name" placeholder="Folder name" required autoFocus />
            {state && "error" in state && (
              <p role="alert" className="text-sm text-[var(--danger)]">
                {state.error}
              </p>
            )}
            <DialogFooter>
              <SubmitButton />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FolderRow({
  node,
  depth,
  counts,
  activeFolderId,
}: {
  node: FolderNode & { children: FolderNode[] };
  depth: number;
  counts: Record<string, number>;
  activeFolderId?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const active = activeFolderId === node.id;

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`Delete "${node.name}"? Notes inside will become unfiled.`)) return;
    deleteFolderAction(node.id).then((r) => {
      if (r && "error" in r) toast.error(r.error);
    });
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-1 text-sm",
          active ? "bg-[var(--brand-muted)] text-[var(--brand)]" : "hover:bg-[var(--surface-sunken)]"
        )}
        style={{ paddingLeft: depth * 14 + 6 }}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={cn("shrink-0 transition-transform", expanded && "rotate-90", !hasChildren && "invisible")}
        >
          <ChevronRight className="size-3.5" />
        </button>
        <Link href={`/notes?folder=${node.id}`} className="flex min-w-0 flex-1 items-center gap-1.5">
          <Folder className="size-3.5 shrink-0" style={{ color: node.color }} />
          <span className="truncate">{node.name}</span>
        </Link>
        <span className="shrink-0 text-xs text-[var(--subtle-foreground)]">{counts[node.id] ?? 0}</span>
        <button
          type="button"
          onClick={handleDelete}
          className="shrink-0 opacity-0 text-[var(--subtle-foreground)] transition-opacity hover:text-[var(--danger)] group-hover:opacity-100"
          aria-label="Delete folder"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {expanded &&
        node.children.map((child) => (
          <FolderRow
            key={child.id}
            node={{ ...child, children: (child as FolderNode & { children: FolderNode[] }).children ?? [] }}
            depth={depth + 1}
            counts={counts}
            activeFolderId={activeFolderId}
          />
        ))}
    </div>
  );
}

export function FolderTree({
  folders,
  counts,
  totalCount,
  pinnedCount,
}: {
  folders: FolderNode[];
  counts: Record<string, number>;
  totalCount: number;
  pinnedCount: number;
}) {
  const searchParams = useSearchParams();
  const activeFolderId = searchParams.get("folder") ?? undefined;
  const filter = searchParams.get("filter");
  const tree = useMemo(() => buildTree(folders, null), [folders]);

  return (
    <div className="flex w-full flex-col gap-3 sm:w-56 sm:shrink-0">
      <div className="flex flex-col gap-0.5">
        <Link
          href="/notes"
          className={cn(
            "flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm",
            !activeFolderId && !filter ? "bg-[var(--brand-muted)] text-[var(--brand)]" : "hover:bg-[var(--surface-sunken)]"
          )}
        >
          <StickyNote className="size-3.5" /> All notes
          <span className="ml-auto text-xs text-[var(--subtle-foreground)]">{totalCount}</span>
        </Link>
        <Link
          href="/notes?filter=pinned"
          className={cn(
            "flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm",
            filter === "pinned" ? "bg-[var(--brand-muted)] text-[var(--brand)]" : "hover:bg-[var(--surface-sunken)]"
          )}
        >
          <Pin className="size-3.5" /> Pinned
          <span className="ml-auto text-xs text-[var(--subtle-foreground)]">{pinnedCount}</span>
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--subtle-foreground)]">Folders</span>
          <NewFolderDialog />
        </div>
        <div className="flex flex-col">
          {tree.map((node) => (
            <FolderRow key={node.id} node={node} depth={0} counts={counts} activeFolderId={activeFolderId} />
          ))}
        </div>
      </div>
    </div>
  );
}
