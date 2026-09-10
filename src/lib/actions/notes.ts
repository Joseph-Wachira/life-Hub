"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/session";
import * as notesService from "@/lib/services/notes";
import {
  createFolderSchema,
  updateFolderSchema,
  updateNoteSchema,
  checklistItemTextSchema,
  tagNameSchema,
} from "@/lib/validations/notes";
import type { ActionResult } from "@/lib/actions/auth";

function revalidateNotes(noteId?: string) {
  revalidatePath("/notes");
  if (noteId) revalidatePath(`/notes/${noteId}`);
}

/* -------------------------------------------------------------------------- */
/* Folders                                                                     */
/* -------------------------------------------------------------------------- */

export async function createFolderAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = createFolderSchema.safeParse({
    name: formData.get("name"),
    parentId: formData.get("parentId") || null,
    color: formData.get("color") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the folder name." };

  await notesService.createFolder(workspace.id, parsed.data);
  revalidateNotes();
  return { success: true };
}

export async function updateFolderAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = updateFolderSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    parentId: formData.get("parentId") || null,
    color: formData.get("color") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the folder name." };

  const ok = await notesService.updateFolder(workspace.id, parsed.data);
  if (!ok) return { error: "That would create a circular folder structure." };

  revalidateNotes();
  return { success: true };
}

export async function deleteFolderAction(folderId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  await notesService.deleteFolder(workspace.id, folderId);
  revalidateNotes();
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/* Notes                                                                        */
/* -------------------------------------------------------------------------- */

export async function createNoteAction(folderId?: string | null) {
  const { workspace } = await requireWorkspace();
  const note = await notesService.createNote(workspace.id, folderId);
  revalidateNotes();
  redirect(`/notes/${note.id}`);
}

export async function updateNoteAction(input: {
  id: string;
  title?: string;
  contentMd?: string;
  isPinned?: boolean;
  folderId?: string | null;
  projectId?: string | null;
}): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = updateNoteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Could not save note." };

  const { id, ...data } = parsed.data;
  const note = await notesService.updateNote(workspace.id, id, data);
  if (!note) return { error: "Note not found." };

  revalidateNotes(id);
  return { success: true };
}

export async function deleteNoteAction(noteId: string) {
  const { workspace } = await requireWorkspace();
  await notesService.deleteNote(workspace.id, noteId);
  revalidateNotes();
  redirect("/notes");
}

export async function togglePinAction(noteId: string, pinned: boolean): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const note = await notesService.updateNote(workspace.id, noteId, { isPinned: pinned });
  if (!note) return { error: "Note not found." };
  revalidateNotes(noteId);
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/* Tags                                                                         */
/* -------------------------------------------------------------------------- */

export async function addTagToNoteAction(
  noteId: string,
  name: string
): Promise<{ id: string; name: string; color: string } | { error: string }> {
  const { workspace } = await requireWorkspace();
  const parsed = tagNameSchema.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid tag." };

  const tag = await notesService.getOrCreateTag(workspace.id, parsed.data);
  await notesService.addTagToNote(workspace.id, noteId, tag.id);
  revalidateNotes(noteId);
  return { id: tag.id, name: tag.name, color: tag.color };
}

export async function removeTagFromNoteAction(noteId: string, tagId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  await notesService.removeTagFromNote(workspace.id, noteId, tagId);
  revalidateNotes(noteId);
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/* Checklist items                                                              */
/* -------------------------------------------------------------------------- */

export async function addChecklistItemAction(noteId: string, text: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = checklistItemTextSchema.safeParse(text);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid item." };

  const item = await notesService.addChecklistItem(workspace.id, noteId, parsed.data);
  if (!item) return { error: "Note not found." };
  revalidateNotes(noteId);
  return { success: true };
}

export async function toggleChecklistItemAction(noteId: string, itemId: string, checked: boolean): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  await notesService.toggleChecklistItem(workspace.id, itemId, checked);
  revalidateNotes(noteId);
  return { success: true };
}

export async function deleteChecklistItemAction(noteId: string, itemId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  await notesService.deleteChecklistItem(workspace.id, itemId);
  revalidateNotes(noteId);
  return { success: true };
}

export async function reorderChecklistItemAction(noteId: string, itemId: string, position: number): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  await notesService.reorderChecklistItem(workspace.id, itemId, position);
  revalidateNotes(noteId);
  return { success: true };
}
