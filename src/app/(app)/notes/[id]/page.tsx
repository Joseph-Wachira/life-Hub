import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/session";
import { listNotes, getNote, listFolders, listProjectsForPicker } from "@/lib/services/notes";
import { NoteListPane } from "@/components/notes/note-list-pane";
import { NoteEditor } from "@/components/notes/note-editor";

export const metadata: Metadata = { title: "Note" };

export default async function NoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ folder?: string; filter?: string; q?: string }>;
}) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;
  const { folder, filter, q } = await searchParams;

  const [note, notes, folders, projects] = await Promise.all([
    getNote(workspace.id, id),
    listNotes(workspace.id, { folderId: folder, onlyPinned: filter === "pinned", query: q }),
    listFolders(workspace.id),
    listProjectsForPicker(workspace.id),
  ]);

  if (!note) notFound();

  return (
    <>
      <div className="hidden sm:block">
        <NoteListPane notes={notes} activeNoteId={note.id} folderId={folder} />
      </div>
      <NoteEditor note={note} folders={folders} projects={projects} />
    </>
  );
}
