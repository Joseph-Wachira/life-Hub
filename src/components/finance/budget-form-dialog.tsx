"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
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
import { createBudgetAction, updateBudgetAction } from "@/lib/actions/finance";
import type { ActionResult } from "@/lib/actions/auth";
import type { CategoryOption } from "./category-select";

export interface BudgetRecord {
  id: string;
  categoryId: string;
  monthlyLimitCents: number;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  budget,
  expenseCategories,
  usedCategoryIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: BudgetRecord | null;
  expenseCategories: CategoryOption[];
  usedCategoryIds: string[];
}) {
  const isEdit = Boolean(budget);
  const action = isEdit ? updateBudgetAction : createBudgetAction;
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? "");

  useEffect(() => {
    if (open) setCategoryId(budget?.categoryId ?? "");
  }, [open, budget]);

  useEffect(() => {
    if (state && "success" in state) onOpenChange(false);
  }, [state, onOpenChange]);

  const availableCategories = expenseCategories.filter(
    (c) => c.id === budget?.categoryId || !usedCategoryIds.includes(c.id)
  );
  const defaultLimit = budget ? (budget.monthlyLimitCents / 100).toFixed(2) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit budget" : "New budget"}</DialogTitle>
          <DialogDescription>Set a monthly spending limit for a category.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={budget!.id} />}
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select name="categoryId" value={categoryId} onValueChange={setCategoryId} disabled={isEdit}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budget-limit">Monthly limit</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--subtle-foreground)]">
                $
              </span>
              <Input id="budget-limit" name="monthlyLimit" inputMode="decimal" defaultValue={defaultLimit} placeholder="0.00" className="pl-6" required />
            </div>
          </div>
          {state && "error" in state && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <SubmitButton label={isEdit ? "Save changes" : "Create budget"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
