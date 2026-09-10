"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProjectAction } from "@/lib/actions/projects";
import { ProjectDialog, type ProjectRecord } from "./project-dialog";

export function ProjectHeaderActions({
  project,
  goals,
}: {
  project: ProjectRecord;
  goals: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Delete "${project.name}"? Its tasks will be un-assigned, not deleted.`)) return;
    startTransition(async () => {
      const result = await deleteProjectAction(project.id);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Project deleted");
      router.push("/projects");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="size-3.5" /> Edit
      </Button>
      <Button variant="ghost" size="icon" className="text-[var(--danger)]" onClick={handleDelete} disabled={isPending} aria-label="Delete project">
        <Trash2 className="size-4" />
      </Button>
      <ProjectDialog open={open} onOpenChange={setOpen} project={project} goals={goals} onSaved={() => router.refresh()} />
    </div>
  );
}
