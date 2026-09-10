import type { Metadata } from "next";
import { NotebookText } from "lucide-react";
import { requireWorkspace } from "@/lib/session";
import { listNotes } from "@/lib/services/notes";
import { NoteListPane } from "@/components/notes/note-list-pane";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Notes" };

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; filter?: string; q?: string }>;
}) {
  const { workspace } = await requireWorkspace();
  const { folder, filter, q } = await searchParams;

  const notes = await listNotes(workspace.id, {
    folderId: folder,
    onlyPinned: filter === "pinned",
    query: q,
  });

  return (
    <>
      <NoteListPane notes={notes} folderId={folder} />
      <div className="hidden flex-1 items-center justify-center sm:flex">
        <EmptyState icon={NotebookText} title="Select a note" description="Choose a note from the list, or create a new one." />
      </div>
    </>
  );
}
