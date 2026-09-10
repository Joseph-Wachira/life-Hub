"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectDialog } from "./project-dialog";

export function NewProjectButton({ goals }: { goals: { id: string; title: string }[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> New project
      </Button>
      <ProjectDialog open={open} onOpenChange={setOpen} goals={goals} onSaved={() => router.refresh()} />
    </>
  );
}
