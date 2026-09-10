"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { TransactionType } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCategoryAction, updateCategoryAction } from "@/lib/actions/finance";
import type { CategoryActionResult } from "@/lib/validations/finance";
import { cn } from "@/lib/utils";

export type CategoryOption = { id: string; name: string; color: string; type: TransactionType };

const SWATCHES = [
  "#6366f1",
  "#22c55e",
  "#ef4444",
  "#f59e0b",
  "#06b6d4",
  "#e879f9",
  "#84cc16",
  "#f97316",
  "#0ea5e9",
  "#a855f7",
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

/**
 * Create/edit dialog for a Category. When `lockType` is set, the type is
 * fixed (used when this dialog is opened inline from a transaction/bill
 * form that already knows whether it needs an income or expense category).
 */
export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  defaultType = "EXPENSE",
  lockType = false,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryOption | null;
  defaultType?: TransactionType;
  lockType?: boolean;
  onSuccess?: (category: CategoryOption) => void;
}) {
  const isEdit = Boolean(category);
  const action = isEdit ? updateCategoryAction : createCategoryAction;
  const [state, formAction] = useActionState<CategoryActionResult | null, FormData>(action, null);
  const [type, setType] = useState<TransactionType>(category?.type ?? defaultType);
  const [color, setColor] = useState(category?.color ?? SWATCHES[0]);

  useEffect(() => {
    if (open) {
      setType(category?.type ?? defaultType);
      setColor(category?.color ?? SWATCHES[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (state && "success" in state) {
      onSuccess?.(state.category);
      onOpenChange(false);
    }
  }, [state, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>Categories organize your transactions, budgets, and bills.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={category!.id} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              name="name"
              defaultValue={category?.name}
              placeholder="e.g. Groceries"
              required
              autoFocus
              maxLength={50}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            {lockType ? (
              <>
                <p className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
                  {type === "INCOME" ? "Income" : "Expense"}
                </p>
                <input type="hidden" name="type" value={type} />
              </>
            ) : (
              <Select name="type" value={type} onValueChange={(v) => setType(v as TransactionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((swatch) => (
                <button
                  type="button"
                  key={swatch}
                  onClick={() => setColor(swatch)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform",
                    color === swatch ? "scale-110 border-[var(--foreground)]" : "border-transparent"
                  )}
                  style={{ backgroundColor: swatch }}
                  aria-label={`Use color ${swatch}`}
                  aria-pressed={color === swatch}
                />
              ))}
            </div>
            <input type="hidden" name="color" value={color} />
          </div>

          {state && "error" in state && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <SubmitButton label={isEdit ? "Save changes" : "Create category"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
