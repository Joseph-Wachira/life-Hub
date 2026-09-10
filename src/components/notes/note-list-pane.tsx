import Link from "next/link";
import { Pin, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, cn } from "@/lib/utils";
import { mdToSnippet } from "./md-snippet";
import { NewNoteButton } from "./new-note-button";

export interface NoteListItem {
  id: string;
  title: string;
  contentMd: string;
  isPinned: boolean;
  updatedAt: Date | string;
  folder: { name: string; color: string } | null;
  tags: { id: string; name: string; color: string }[];
}

export function NoteListPane({
  notes,
  activeNoteId,
  folderId,
}: {
  notes: NoteListItem[];
  activeNoteId?: string;
  folderId?: string;
}) {
  return (
    <div className="flex w-full flex-col gap-3 border-[var(--border)] sm:w-72 sm:shrink-0 sm:border-r sm:pr-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Notes ({notes.length})</h2>
        <NewNoteButton folderId={folderId} />
      </div>
      {notes.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No notes here"
          description="Create your first note to start capturing ideas."
          className="py-8"
        />
      ) : (
        <div className="flex flex-col gap-1">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className={cn(
                "flex flex-col gap-0.5 rounded-[var(--radius-md)] px-3 py-2 transition-colors",
                activeNoteId === note.id ? "bg-[var(--brand-muted)]" : "hover:bg-[var(--surface-sunken)]"
              )}
            >
              <div className="flex items-center gap-1.5">
                {note.isPinned && <Pin className="size-3 shrink-0 text-[var(--brand)]" />}
                <span className="truncate text-sm font-medium">{note.title || "Untitled note"}</span>
              </div>
              <p className="line-clamp-1 text-xs text-[var(--muted-foreground)]">
                {mdToSnippet(note.contentMd, 80) || "No content yet"}
              </p>
              <span className="text-xs text-[var(--subtle-foreground)]">
                {formatDate(note.updatedAt)}
                {note.folder && ` · ${note.folder.name}`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
