import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";
import { requireWorkspace } from "@/lib/session";
import { listProjects } from "@/lib/services/projects";
import { listGoalOptions } from "@/lib/services/tasks";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectCard } from "@/components/projects/project-card";
import { NewProjectButton } from "@/components/projects/new-project-button";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const { workspace } = await requireWorkspace();
  const [projects, goals] = await Promise.all([
    listProjects(workspace.id),
    listGoalOptions(workspace.id),
  ]);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Projects"
        description="Group related tasks and track progress toward a bigger outcome."
        actions={<NewProjectButton goals={goals} />}
      />
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create a project to group related tasks and track progress together."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
