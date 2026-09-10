/**
 * Computes the "done / total" progress of a task's subtasks, treating any
 * status other than DONE as not-yet-complete (mirrors the TaskStatus enum
 * without importing Prisma types, so this stays a plain, dependency-free
 * function that's easy to unit test).
 */
export function subtaskProgress(subtasks: { status: string }[]): { done: number; total: number } {
  const total = subtasks.length;
  const done = subtasks.filter((s) => s.status === "DONE").length;
  return { done, total };
}
