"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { format } from "date-fns";
import type { BillFrequency } from "@prisma/client";
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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createRecurringBillAction, updateRecurringBillAction } from "@/lib/actions/finance";
import type { ActionResult } from "@/lib/actions/auth";
import { CategorySelect, type CategoryOption } from "./category-select";

export interface BillRecord {
  id: string;
  name: string;
  amountCents: number;
  categoryId: string | null;
  frequency: BillFrequency;
  nextDueDate: string | Date;
  autoPay: boolean;
  reminderDaysBefore: number;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function BillFormDialog({
  open,
  onOpenChange,
  bill,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: BillRecord | null;
  categories: CategoryOption[];
}) {
  const isEdit = Boolean(bill);
  const action = isEdit ? updateRecurringBillAction : createRecurringBillAction;
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);
  const [categoryId, setCategoryId] = useState(bill?.categoryId ?? "none");
  const [frequency, setFrequency] = useState<BillFrequency>(bill?.frequency ?? "MONTHLY");
  const [autoPay, setAutoPay] = useState(bill?.autoPay ?? false);
  const [localCategories, setLocalCategories] = useState(categories);

  useEffect(() => {
    if (open) {
      setCategoryId(bill?.categoryId ?? "none");
      setFrequency(bill?.frequency ?? "MONTHLY");
      setAutoPay(bill?.autoPay ?? false);
    }
  }, [open, bill]);

  useEffect(() => {
    if (state && "success" in state) onOpenChange(false);
  }, [state, onOpenChange]);

  const defaultDate = bill ? format(new Date(bill.nextDueDate), "yyyy-MM-dd") : "";
  const defaultAmount = bill ? (bill.amountCents / 100).toFixed(2) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit bill" : "New recurring bill"}</DialogTitle>
          <DialogDescription>Bills you pay on a schedule — rent, subscriptions, insurance.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={bill!.id} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bill-name">Name</Label>
            <Input id="bill-name" name="name" defaultValue={bill?.name ?? ""} placeholder="e.g. Rent" required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bill-amount">Amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--subtle-foreground)]">$</span>
                <Input id="bill-amount" name="amount" inputMode="decimal" defaultValue={defaultAmount} placeholder="0.00" className="pl-6" required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Frequency</Label>
              <Select name="frequency" value={frequency} onValueChange={(v) => setFrequency(v as BillFrequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <CategorySelect
              name="categoryId"
              type="EXPENSE"
              categories={localCategories}
              value={categoryId}
              onChange={setCategoryId}
              onCategoryCreated={(c) => setLocalCategories((prev) => [...prev, c])}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bill-due">Next due date</Label>
              <Input id="bill-due" name="nextDueDate" type="date" defaultValue={defaultDate} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bill-reminder">Remind (days before)</Label>
              <Input
                id="bill-reminder"
                name="reminderDaysBefore"
                type="number"
                min={0}
                max={30}
                defaultValue={bill?.reminderDaysBefore ?? 3}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={autoPay} onCheckedChange={setAutoPay} />
            Autopay enabled
            <input type="hidden" name="autoPay" value={autoPay ? "on" : ""} />
          </label>
          {state && "error" in state && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <SubmitButton label={isEdit ? "Save changes" : "Add bill"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
