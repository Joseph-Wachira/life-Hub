"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { TransactionType } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryFormDialog, type CategoryOption } from "./category-form-dialog";

export type { CategoryOption };

const NEW_CATEGORY_VALUE = "__new__";
const NONE_VALUE = "none";

/**
 * A category picker filtered to a given transaction type, with an inline
 * "New category" option so a brand-new workspace (no categories yet) never
 * has to leave the current form to set one up.
 */
export function CategorySelect({
  categories,
  type,
  value,
  onChange,
  onCategoryCreated,
  name,
  allowNone = true,
  placeholder = "Select a category",
}: {
  categories: CategoryOption[];
  type: TransactionType;
  value: string;
  onChange: (value: string) => void;
  onCategoryCreated?: (category: CategoryOption) => void;
  name?: string;
  allowNone?: boolean;
  placeholder?: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const filtered = categories.filter((c) => c.type === type);

  return (
    <>
      <Select
        name={name}
        value={value}
        onValueChange={(v) => {
          if (v === NEW_CATEGORY_VALUE) {
            setCreateOpen(true);
            return;
          }
          onChange(v);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowNone && <SelectItem value={NONE_VALUE}>No category</SelectItem>}
          {filtered.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </span>
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value={NEW_CATEGORY_VALUE}>
            <span className="inline-flex items-center gap-2 text-[var(--brand)]">
              <Plus className="size-3.5" />
              New category
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <CategoryFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultType={type}
        lockType
        onSuccess={(category) => {
          onCategoryCreated?.(category);
          onChange(category.id);
        }}
      />
    </>
  );
}
