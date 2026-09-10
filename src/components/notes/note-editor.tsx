"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { ArrowLeft, Eye, Pencil, Pin, PinOff, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  addChecklistItemAction,
  addTagToNoteAction,
  deleteChecklistItemAction,
  deleteNoteAction,
  removeTagFromNoteAction,
  reorderChecklistItemAction,
  toggleChecklistItemAction,
  updateNoteAction,
} from "@/lib/actions/notes";
import { positionBetween } from "@/lib/utils";
import type { NoteListItem } from "./note-list-pane";

export interface NoteDetail extends NoteListItem {
  folderId: string | null;
  projectId: string | null;
  checklist: { id: string; text: string; checked: boolean; position: number }[];
}

export function NoteEditor({
  note,
  folders,
  projects,
}: {
  note: NoteDetail;
  folders: { id: string; name: string }[];
  projects: { id: string; name: string; color: string }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.contentMd);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [tags, setTags] = useState(note.tags);
  const [checklist, setChecklist] = useState(note.checklist);
  const [newItemText, setNewItemText] = useState("");
  const [newTagText, setNewTagText] = useState("");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.contentMd);
    setTags(note.tags);
    setChecklist(note.checklist);
  }, [note.id, note.title, note.contentMd, note.tags, note.checklist]);

  const save = useCallback(
    (patch: Partial<{ title: string; contentMd: string; isPinned: boolean; folderId: string | null; projectId: string | null }>) => {
      setSaveState("saving");
      updateNoteAction({ id: note.id, ...patch }).then((result) => {
        if (result && "error" in result) {
          toast.error(result.error);
          setSaveState("idle");
        } else {
          setSaveState("saved");
          router.refresh();
        }
      });
    },
    [note.id, router]
  );

  function scheduleSave(patch: { title?: string; contentMd?: string }) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => save(patch), 600);
  }

  function handleTogglePin() {
    save({ isPinned: !note.isPinned });
  }

  function handleDelete() {
    if (!confirm(`Delete "${title || "this note"}"? This can't be undone.`)) return;
    deleteNoteAction(note.id);
  }

  async function handleAddTag() {
    const value = newTagText.trim();
    if (!value) return;
    setNewTagText("");
    const result = await addTagToNoteAction(note.id, value);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setTags((prev) => (prev.some((t) => t.id === result.id) ? prev : [...prev, result]));
  }

  async function handleRemoveTag(tagId: string) {
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    const result = await removeTagFromNoteAction(note.id, tagId);
    if (result && "error" in result) toast.error(result.error);
  }

  async function handleAddChecklistItem() {
    const value = newItemText.trim();
    if (!value) return;
    setNewItemText("");
    const result = await addChecklistItemAction(note.id, value);
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleToggleItem(id: string, checked: boolean) {
    setChecklist((prev) => prev.map((i) => (i.id === id ? { ...i, checked } : i)));
    const result = await toggleChecklistItemAction(note.id, id, checked);
    if (result && "error" in result) toast.error(result.error);
  }

  async function handleDeleteItem(id: string) {
    setChecklist((prev) => prev.filter((i) => i.id !== id));
    const result = await deleteChecklistItemAction(note.id, id);
    if (result && "error" in result) toast.error(result.error);
  }

  async function handleMoveItem(index: number, direction: -1 | 1) {
    const sorted = [...checklist].sort((a, b) => a.position - b.position);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const moving = sorted[index];
    const before = direction === -1 ? sorted[targetIndex - 1] : sorted[targetIndex];
    const after = direction === -1 ? sorted[targetIndex] : sorted[targetIndex + 1];
    const newPosition = positionBetween(before?.position ?? null, after?.position ?? null);
    setChecklist((prev) => prev.map((i) => (i.id === moving.id ? { ...i, position: newPosition } : i)));
    const result = await reorderChecklistItemAction(note.id, moving.id, newPosition);
    if (result && "error" in result) toast.error(result.error);
  }

  const sortedChecklist = [...checklist].sort((a, b) => a.position - b.position);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/notes" className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:hidden">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleSave({ title: e.target.value });
          }}
          placeholder="Untitled note"
          className="flex-1 border-none bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
        />
        <span className="shrink-0 text-xs text-[var(--subtle-foreground)]">
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
        </span>
        <Button variant="ghost" size="icon" onClick={handleTogglePin} aria-label={note.isPinned ? "Unpin" : "Pin"}>
          {note.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="text-[var(--danger)]" onClick={handleDelete} aria-label="Delete note">
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={note.folderId ?? "none"}
          onValueChange={(v) => save({ folderId: v === "none" ? null : v })}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="No folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No folder</SelectItem>
            {folders.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={note.projectId ?? "none"}
          onValueChange={(v) => save({ projectId: v === "none" ? null : v })}
        >
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue placeholder="No project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No project</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
            >
              {tag.name}
              <button onClick={() => handleRemoveTag(tag.id)} aria-label={`Remove ${tag.name}`}>
                <X className="size-3" />
              </button>
            </span>
          ))}
          <Input
            value={newTagText}
            onChange={(e) => setNewTagText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="+ tag"
            className="h-6 w-20 border-none bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--surface-sunken)] p-1 w-fit">
        <button
          onClick={() => setMode("write")}
          className={`flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium transition-colors ${mode === "write" ? "bg-[var(--surface)] shadow-[var(--shadow-sm)]" : "text-[var(--muted-foreground)]"}`}
        >
          <Pencil className="size-3.5" /> Write
        </button>
        <button
          onClick={() => setMode("preview")}
          className={`flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium transition-colors ${mode === "preview" ? "bg-[var(--surface)] shadow-[var(--shadow-sm)]" : "text-[var(--muted-foreground)]"}`}
        >
          <Eye className="size-3.5" /> Preview
        </button>
      </div>

      {mode === "write" ? (
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            scheduleSave({ contentMd: e.target.value });
          }}
          placeholder="Start writing… supports Markdown."
          className="min-h-64 flex-1 resize-none font-mono text-sm"
        />
      ) : (
        <div className="note-prose min-h-64 flex-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
          {content.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          ) : (
            <p className="text-[var(--subtle-foreground)]">Nothing to preview yet.</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Checklist</h3>
        {sortedChecklist.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2">
            <Checkbox checked={item.checked} onCheckedChange={(c) => handleToggleItem(item.id, c === true)} />
            <span className={item.checked ? "flex-1 text-sm text-[var(--subtle-foreground)] line-through" : "flex-1 text-sm"}>
              {item.text}
            </span>
            <button onClick={() => handleMoveItem(i, -1)} className="text-[var(--subtle-foreground)] hover:text-[var(--foreground)]" aria-label="Move up" disabled={i === 0}>
              ↑
            </button>
            <button onClick={() => handleMoveItem(i, 1)} className="text-[var(--subtle-foreground)] hover:text-[var(--foreground)]" aria-label="Move down" disabled={i === sortedChecklist.length - 1}>
              ↓
            </button>
            <button onClick={() => handleDeleteItem(item.id)} className="text-[var(--subtle-foreground)] hover:text-[var(--danger)]" aria-label="Remove item">
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddChecklistItem();
              }
            }}
            placeholder="Add a checklist item…"
            className="h-8 flex-1 text-sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAddChecklistItem}>
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
