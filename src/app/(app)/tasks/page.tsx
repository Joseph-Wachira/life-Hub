import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/session";
import { listTasks, listWorkspaceTags, listProjectOptions, listGoalOptions } from "@/lib/services/tasks";
import { TasksClient } from "@/components/tasks/tasks-client";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage() {
  const { workspace } = await requireWorkspace();

  const [tasks, tags, projects, goals] = await Promise.all([
    listTasks(workspace.id),
    listWorkspaceTags(workspace.id),
    listProjectOptions(workspace.id),
    listGoalOptions(workspace.id),
  ]);

  return <TasksClient tasks={tasks} projects={projects} goals={goals} tags={tags} />;
}
