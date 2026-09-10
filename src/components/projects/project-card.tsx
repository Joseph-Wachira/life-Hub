import Link from "next/link";
import { Calendar } from "lucide-react";
import type { ProjectStatus } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDate, pluralize } from "@/lib/utils";

const STATUS_META: Record<ProjectStatus, { label: string; variant: "default" | "secondary" | "success" | "warning" }> = {
  ACTIVE: { label: "Active", variant: "default" },
  ON_HOLD: { label: "On hold", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
};

export interface ProjectListItem {
  id: string;
  name: string;
  color: string;
  status: ProjectStatus;
  dueAt: Date | string | null;
  taskCount: number;
  doneCount: number;
  progress: number;
}

export function ProjectCard({ project }: { project: ProjectListItem }) {
  const statusMeta = STATUS_META[project.status];

  return (
    <Link href={`/projects/${project.id}`} className="block rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
      <Card className="flex h-full flex-col gap-3 p-5 transition-colors hover:border-[var(--border-strong)]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
            <h3 className="truncate font-medium leading-tight">{project.name}</h3>
          </div>
          <Badge variant={statusMeta.variant} className="shrink-0">
            {statusMeta.label}
          </Badge>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>
              {project.taskCount === 0
                ? "No tasks yet"
                : `${project.doneCount}/${project.taskCount} ${pluralize(project.taskCount, "task")}`}
            </span>
            <span className="font-medium text-[var(--foreground)]">{project.progress}%</span>
          </div>
          <Progress value={project.progress} />
        </div>

        {project.dueAt && (
          <div className="mt-auto flex items-center gap-1.5 text-xs text-[var(--subtle-foreground)]">
            <Calendar className="size-3.5" />
            <span>Due {formatDate(project.dueAt)}</span>
          </div>
        )}
      </Card>
    </Link>
  );
}
