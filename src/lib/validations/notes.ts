import { z } from "zod";

const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex color like #6366f1");

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, "Name your folder").max(60),
  parentId: z.string().trim().min(1).nullable().optional(),
  color: hexColor.optional(),
});
export type CreateFolderInput = z.infer<typeof createFolderSchema>;

export const updateFolderSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, "Name your folder").max(60),
  parentId: z.string().trim().min(1).nullable().optional(),
  color: hexColor.optional(),
});
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;

export const updateNoteSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().max(200).optional(),
  contentMd: z.string().max(200_000).optional(),
  isPinned: z.boolean().optional(),
  folderId: z.string().trim().min(1).nullable().optional(),
  projectId: z.string().trim().min(1).nullable().optional(),
});
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export const checklistItemTextSchema = z.string().trim().min(1, "Add some text").max(280);

export const tagNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a tag name")
  .max(40)
  .transform((v) => v.toLowerCase());

export const noteFiltersSchema = z.object({
  folderId: z.string().trim().min(1).optional(),
  filter: z.enum(["all", "pinned"]).optional(),
  tagId: z.string().trim().min(1).optional(),
  q: z.string().trim().max(200).optional(),
});
export type NoteFilters = z.infer<typeof noteFiltersSchema>;
