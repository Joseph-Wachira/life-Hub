import { z } from "zod";
import type { TransactionType } from "@prisma/client";

/**
 * Parses a user-typed dollar amount (e.g. "12.50", "$1,240", "12") into
 * integer cents. Returns NaN for anything that isn't a valid number so
 * callers can validate the result themselves.
 */
export function parseDollarsToCents(input: string): number {
  const trimmed = input.trim().replace(/^\$/, "").replace(/,/g, "");
  if (trimmed === "" || !/^-?\d*\.?\d*$/.test(trimmed)) return NaN;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return NaN;
  return Math.round(value * 100);
}

/** Formats integer cents back into a plain "12.50" string for form defaults. */
export function centsToDollarsInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);
export const billFrequencySchema = z.enum(["WEEKLY", "MONTHLY", "YEARLY"]);

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Keep it under 50 characters"),
  type: transactionTypeSchema,
  color: z.string().trim().regex(HEX_COLOR, "Pick a valid color"),
});
export type CategoryFormInput = z.infer<typeof categorySchema>;

export type CategoryActionResult =
  | { error: string }
  | {
      success: true;
      category: { id: string; name: string; color: string; type: TransactionType };
    };

export const transactionSchema = z.object({
  type: transactionTypeSchema,
  amountCents: z.number().finite("Enter a valid amount").positive("Enter an amount greater than zero"),
  categoryId: z.string().trim().min(1).nullable(),
  description: z
    .string()
    .trim()
    .max(200, "Keep it under 200 characters")
    .optional()
    .or(z.literal("")),
  occurredAt: z.string().trim().min(1, "Date is required"),
});

export const budgetCreateSchema = z.object({
  categoryId: z.string().trim().min(1, "Choose a category"),
  monthlyLimitCents: z.number().finite("Enter a valid amount").positive("Enter a limit greater than zero"),
});

export const budgetUpdateSchema = z.object({
  monthlyLimitCents: z.number().finite("Enter a valid amount").positive("Enter a limit greater than zero"),
});

export const recurringBillSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Keep it under 80 characters"),
  amountCents: z.number().finite("Enter a valid amount").positive("Enter an amount greater than zero"),
  categoryId: z.string().trim().min(1).nullable(),
  frequency: billFrequencySchema,
  nextDueDate: z.string().trim().min(1, "Due date is required"),
  autoPay: z.boolean(),
  reminderDaysBefore: z
    .number()
    .int("Whole days only")
    .min(0, "Can't be negative")
    .max(60, "Keep it under 60 days"),
});

export const savingsGoalSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Keep it under 80 characters"),
  targetAmountCents: z.number().finite("Enter a valid amount").positive("Enter a target greater than zero"),
  targetDate: z.string().trim().optional().or(z.literal("")),
  color: z.string().trim().regex(HEX_COLOR, "Pick a valid color"),
});

export const contributeSchema = z.object({
  amountCents: z.number().finite("Enter a valid amount").positive("Enter an amount greater than zero"),
});
