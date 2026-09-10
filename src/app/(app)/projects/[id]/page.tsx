import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireWorkspace } from "@/lib/session";
import { getProject, getProjectProgress } from "@/lib/services/projects";
import { listTasks, listWorkspaceTags, listGoalOptions } from "@/lib/services/tasks";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectHeaderActions } from "@/components/projects/project-header-actions";
import { ProjectTaskBoard } from "@/components/projects/project-task-board";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { workspace } = await requireWorkspace();
  const { id } = await params;

  const project = await getProject(id, workspace.id);
  if (!project) notFound();

  const [progress, tasks, tags, goals] = await Promise.all([
    getProjectProgress(id),
    listTasks(workspace.id, { projectId: id }),
    listWorkspaceTags(workspace.id),
    listGoalOptions(workspace.id),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/projects"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="size-4" /> Back to projects
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
            {project.description && <p className="text-sm text-[var(--muted-foreground)]">{project.description}</p>}
            <p className="text-xs text-[var(--subtle-foreground)]">
              {project.goal && `Linked to “${project.goal.title}” · `}
              {project.dueAt && `Due ${formatDate(project.dueAt)}`}
            </p>
          </div>
        </div>
        <ProjectHeaderActions project={project} goals={goals} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-[var(--muted-foreground)]">
              {progress.doneCount}/{progress.taskCount} tasks · {progress.progress}%
            </span>
          </div>
          <Progress value={progress.progress} />
        </CardContent>
      </Card>

      <ProjectTaskBoard project={project} tasks={tasks} goals={goals} tags={tags} />
    </div>
  );
}
