"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Plus, Tag as TagIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTagAction } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface TagOption {
  id: string;
  name: string;
  color: string;
}

interface TagMultiSelectProps {
  options: TagOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onOptionCreated: (tag: TagOption) => void;
}

export function TagMultiSelect({ options, selectedIds, onChange, onOptionCreated }: TagMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const selected = useMemo(
    () => options.filter((o) => selectedIds.includes(o.id)),
    [options, selectedIds]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const exactMatch = options.some((o) => o.name.toLowerCase() === query.trim().toLowerCase());
  const canCreate = query.trim().length > 0 && !exactMatch;

  function toggle(id: string) {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((i) => i !== id));
    else onChange([...selectedIds, id]);
  }

  function handleCreate() {
    const name = query.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await createTagAction(name);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      onOptionCreated(result);
      onChange([...selectedIds, result.id]);
      setQuery("");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {selected.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => toggle(tag.id)}
              className="rounded-full opacity-70 hover:opacity-100"
              aria-label={`Remove ${tag.name}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
              <TagIcon className="size-3.5" />
              Add tag
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-2">
            <Input
              autoFocus
              placeholder="Search or create a tag…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (canCreate) handleCreate();
                }
              }}
              className="mb-2 h-8 text-sm"
            />
            <div className="flex max-h-40 flex-col gap-0.5 overflow-y-auto">
              {filtered.map((tag) => {
                const isSelected = selectedIds.includes(tag.id);
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => toggle(tag.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm hover:bg-[var(--surface-sunken)]",
                      isSelected && "bg-[var(--surface-sunken)]"
                    )}
                  >
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="flex-1 truncate">{tag.name}</span>
                    {isSelected && <Check className="size-3.5 text-[var(--brand)]" />}
                  </button>
                );
              })}
              {filtered.length === 0 && !canCreate && (
                <p className="px-2 py-1.5 text-xs text-[var(--subtle-foreground)]">No tags yet.</p>
              )}
            </div>
            {canCreate && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleCreate}
                className="mt-1 flex w-full items-center gap-2 rounded-[var(--radius-sm)] border-t border-[var(--border)] px-2 py-1.5 pt-2 text-left text-sm text-[var(--brand)] disabled:opacity-60"
              >
                <Plus className="size-3.5" />
                {isPending ? "Creating…" : `Create "${query.trim()}"`}
              </button>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
