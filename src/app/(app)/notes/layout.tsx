import { requireWorkspace } from "@/lib/session";
import { listFolders, folderNoteCounts, listNotes } from "@/lib/services/notes";
import { PageHeader } from "@/components/layout/page-header";
import { FolderTree } from "@/components/notes/folder-tree";
import { NoteSearchBar } from "@/components/notes/note-search-bar";

export default async function NotesLayout({ children }: { children: React.ReactNode }) {
  const { workspace } = await requireWorkspace();
  const [folders, counts, pinned] = await Promise.all([
    listFolders(workspace.id),
    folderNoteCounts(workspace.id),
    listNotes(workspace.id, { onlyPinned: true }),
  ]);

  return (
    <div className="flex flex-col">
      <PageHeader title="Notes" description="Rich notes, folders, tags, and checklists — searchable across everything." />
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:px-6 lg:px-8">
        <FolderTree folders={folders} counts={counts.counts} totalCount={counts.total} pinnedCount={pinned.length} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <NoteSearchBar />
          <div className="flex flex-1 flex-col gap-4 sm:flex-row">{children}</div>
        </div>
      </div>
    </div>
  );
}
