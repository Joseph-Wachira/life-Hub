"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createNoteAction } from "@/lib/actions/notes";

export function NewNoteButton({ folderId }: { folderId?: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      disabled={isPending}
      onClick={() => startTransition(() => createNoteAction(folderId))}
      aria-label="New note"
    >
      <Plus className="size-4" />
    </Button>
  );
}
