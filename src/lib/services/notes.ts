import { db } from "@/lib/db";
import { positionBetween } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Folders                                                             */
/* ------------------------------------------------------------------ */

export async function listFolders(workspaceId: string) {
  return db.noteFolder.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
  });
}

/** Counts of notes per folder, plus how many notes have no folder at all. */
export async function folderNoteCounts(workspaceId: string) {
  const groups = await db.note.groupBy({
    by: ["folderId"],
    where: { workspaceId },
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  let unfiled = 0;
  let total = 0;
  for (const g of groups) {
    total += g._count._all;
    if (g.folderId) counts[g.folderId] = g._count._all;
    else unfiled = g._count._all;
  }
  return { counts, unfiled, total };
}

async function wouldCreateCycle(workspaceId: string, folderId: string, newParentId: string) {
  let current: string | null = newParentId;
  for (let i = 0; i < 50 && current; i++) {
    if (current === folderId) return true;
    const parent: { parentId: string | null } | null = await db.noteFolder.findFirst({
      where: { id: current, workspaceId },
      select: { parentId: true },
    });
    current = parent?.parentId ?? null;
  }
  return false;
}

export async function createFolder(
  workspaceId: string,
  input: { name: string; parentId?: string | null; color?: string }
) {
  return db.noteFolder.create({
    data: {
      workspaceId,
      name: input.name,
      parentId: input.parentId ?? null,
      ...(input.color ? { color: input.color } : {}),
    },
  });
}

export async function updateFolder(
  workspaceId: string,
  input: { id: string; name: string; parentId?: string | null; color?: string }
) {
  if (input.parentId) {
    if (input.parentId === input.id) return false;
    if (await wouldCreateCycle(workspaceId, input.id, input.parentId)) return false;
  }
  const result = await db.noteFolder.updateMany({
    where: { id: input.id, workspaceId },
    data: {
      name: input.name,
      parentId: input.parentId ?? null,
      ...(input.color ? { color: input.color } : {}),
    },
  });
  return result.count > 0;
}

/** Children folders cascade-delete; notes inside are set to unfiled (folderId null). */
export async function deleteFolder(workspaceId: string, id: string) {
  const result = await db.noteFolder.deleteMany({ where: { id, workspaceId } });
  return result.count > 0;
}

/* ------------------------------------------------------------------ */
/* Tags                                                                 */
/* ------------------------------------------------------------------ */

export async function listTags(workspaceId: string) {
  return db.tag.findMany({ where: { workspaceId }, orderBy: { name: "asc" } });
}

export async function getOrCreateTag(workspaceId: string, name: string) {
  const existing = await db.tag.findUnique({
    where: { workspaceId_name: { workspaceId, name } },
  });
  if (existing) return existing;
  return db.tag.create({ data: { workspaceId, name } });
}

export async function addTagToNote(workspaceId: string, noteId: string, tagId: string) {
  const note = await db.note.findFirst({ where: { id: noteId, workspaceId }, select: { id: true } });
  if (!note) return false;
  await db.note.update({ where: { id: noteId }, data: { tags: { connect: { id: tagId } } } });
  return true;
}

export async function removeTagFromNote(workspaceId: string, noteId: string, tagId: string) {
  const note = await db.note.findFirst({ where: { id: noteId, workspaceId }, select: { id: true } });
  if (!note) return false;
  await db.note.update({ where: { id: noteId }, data: { tags: { disconnect: { id: tagId } } } });
  return true;
}

/* ------------------------------------------------------------------ */
/* Projects (read-only, for the note ↔ project picker)                 */
/* ------------------------------------------------------------------ */

export async function listProjectsForPicker(workspaceId: string) {
  return db.project.findMany({
    where: { workspaceId, status: { not: "ARCHIVED" } },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });
}

/* ------------------------------------------------------------------ */
/* Notes                                                               */
/* ------------------------------------------------------------------ */

export interface NoteListFilters {
  folderId?: string;
  onlyPinned?: boolean;
  tagId?: string;
  query?: string;
}

export async function listNotes(workspaceId: string, filters: NoteListFilters = {}) {
  const { folderId, onlyPinned, tagId, query } = filters;
  return db.note.findMany({
    where: {
      workspaceId,
      ...(folderId ? { folderId } : {}),
      ...(onlyPinned ? { isPinned: true } : {}),
      ...(tagId ? { tags: { some: { id: tagId } } } : {}),
      ...(query
        ? { OR: [{ title: { contains: query } }, { contentMd: { contains: query } }] }
        : {}),
    },
    include: { tags: true, folder: true },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getNote(workspaceId: string, id: string) {
  return db.note.findFirst({
    where: { id, workspaceId },
    include: {
      tags: { orderBy: { name: "asc" } },
      folder: true,
      project: true,
      checklist: { orderBy: { position: "asc" } },
    },
  });
}

export async function createNote(workspaceId: string, folderId?: string | null) {
  return db.note.create({
    data: {
      workspaceId,
      folderId: folderId ?? null,
      title: "Untitled note",
      contentMd: "",
    },
  });
}

export interface UpdateNoteData {
  title?: string;
  contentMd?: string;
  isPinned?: boolean;
  folderId?: string | null;
  projectId?: string | null;
}

export async function updateNote(workspaceId: string, id: string, data: UpdateNoteData) {
  const result = await db.note.updateMany({ where: { id, workspaceId }, data });
  if (result.count === 0) return null;
  return db.note.findUnique({ where: { id } });
}

export async function deleteNote(workspaceId: string, id: string) {
  const result = await db.note.deleteMany({ where: { id, workspaceId } });
  return result.count > 0;
}

/* ------------------------------------------------------------------ */
/* Checklist items                                                      */
/* ------------------------------------------------------------------ */

export async function addChecklistItem(workspaceId: string, noteId: string, text: string) {
  const note = await db.note.findFirst({ where: { id: noteId, workspaceId }, select: { id: true } });
  if (!note) return null;

  const last = await db.noteChecklistItem.findFirst({
    where: { noteId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  return db.noteChecklistItem.create({
    data: { noteId, text, position: positionBetween(last?.position ?? null, null) },
  });
}

export async function toggleChecklistItem(workspaceId: string, id: string, checked: boolean) {
  const result = await db.noteChecklistItem.updateMany({
    where: { id, note: { workspaceId } },
    data: { checked },
  });
  return result.count > 0;
}

export async function deleteChecklistItem(workspaceId: string, id: string) {
  const result = await db.noteChecklistItem.deleteMany({ where: { id, note: { workspaceId } } });
  return result.count > 0;
}

/** Sets an item's exact float position — callers compute it via positionBetween
 *  against the neighbors it should land between. */
export async function reorderChecklistItem(workspaceId: string, id: string, position: number) {
  const result = await db.noteChecklistItem.updateMany({
    where: { id, note: { workspaceId } },
    data: { position },
  });
  return result.count > 0;
}
