"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/session";
import * as financeService from "@/lib/services/finance";
import {
  budgetCreateSchema,
  budgetUpdateSchema,
  categorySchema,
  contributeSchema,
  parseDollarsToCents,
  recurringBillSchema,
  savingsGoalSchema,
  transactionSchema,
  type CategoryActionResult,
} from "@/lib/validations/finance";
import type { ActionResult } from "@/lib/actions/auth";

const FINANCE_PATHS = [
  "/finance",
  "/finance/transactions",
  "/finance/budgets",
  "/finance/bills",
  "/finance/savings",
  "/finance/categories",
];

function revalidateFinance() {
  for (const path of FINANCE_PATHS) revalidatePath(path);
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

function firstIssueMessage(error: { issues: { message: string }[] }, fallback: string) {
  return error.issues[0]?.message ?? fallback;
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export async function createCategoryAction(
  _prev: CategoryActionResult | null,
  formData: FormData
): Promise<CategoryActionResult> {
  const { workspace } = await requireWorkspace();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error, "Please check your details.") };

  try {
    const category = await financeService.createCategory(workspace.id, parsed.data);
    revalidateFinance();
    return { success: true, category };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "A category with this name and type already exists." };
    }
    throw error;
  }
}

export async function updateCategoryAction(
  _prev: CategoryActionResult | null,
  formData: FormData
): Promise<CategoryActionResult> {
  await requireWorkspace();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing category." };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error, "Please check your details.") };

  try {
    const category = await financeService.updateCategory(id, parsed.data);
    revalidateFinance();
    return { success: true, category };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "A category with this name and type already exists." };
    }
    throw error;
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  await requireWorkspace();
  await financeService.deleteCategory(id);
  revalidateFinance();
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/* Transactions                                                                */
/* -------------------------------------------------------------------------- */

function readCategoryId(formData: FormData) {
  const raw = String(formData.get("categoryId") ?? "none");
  return raw === "none" || raw === "" ? null : raw;
}

export async function createTransactionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();

  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    amountCents: parseDollarsToCents(String(formData.get("amount") ?? "")),
    categoryId: readCategoryId(formData),
    description: formData.get("description") ?? "",
    occurredAt: formData.get("occurredAt"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error, "Please check your details.") };

  const occurredAt = new Date(parsed.data.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) return { error: "Enter a valid date." };

  await financeService.createTransaction(workspace.id, {
    type: parsed.data.type,
    amountCents: parsed.data.amountCents,
    categoryId: parsed.data.categoryId,
    description: parsed.data.description || null,
    occurredAt,
  });
  revalidateFinance();
  return { success: true };
}

export async function updateTransactionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireWorkspace();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing transaction." };

  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    amountCents: parseDollarsToCents(String(formData.get("amount") ?? "")),
    categoryId: readCategoryId(formData),
    description: formData.get("description") ?? "",
    occurredAt: formData.get("occurredAt"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error, "Please check your details.") };

  const occurredAt = new Date(parsed.data.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) return { error: "Enter a valid date." };

  await financeService.updateTransaction(id, {
    type: parsed.data.type,
    amountCents: parsed.data.amountCents,
    categoryId: parsed.data.categoryId,
    description: parsed.data.description || null,
    occurredAt,
  });
  revalidateFinance();
  return { success: true };
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  await requireWorkspace();
  await financeService.deleteTransaction(id);
  revalidateFinance();
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/* Budgets                                                                     */
/* -------------------------------------------------------------------------- */

export async function createBudgetAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();

  const parsed = budgetCreateSchema.safeParse({
    categoryId: formData.get("categoryId"),
    monthlyLimitCents: parseDollarsToCents(String(formData.get("monthlyLimit") ?? "")),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error, "Please check your details.") };

  try {
    await financeService.createBudget(workspace.id, parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "This category already has a budget — edit it instead." };
    }
    throw error;
  }
  revalidateFinance();
  return { success: true };
}

export async function updateBudgetAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireWorkspace();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing budget." };

  const parsed = budgetUpdateSchema.safeParse({
    monthlyLimitCents: parseDollarsToCents(String(formData.get("monthlyLimit") ?? "")),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error, "Please check your details.") };

  await financeService.updateBudget(id, parsed.data);
  revalidateFinance();
  return { success: true };
}

export async function deleteBudgetAction(id: string): Promise<ActionResult> {
  await requireWorkspace();
  await financeService.deleteBudget(id);
  revalidateFinance();
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/* Recurring bills                                                             */
/* -------------------------------------------------------------------------- */

export async function createRecurringBillAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();

  const parsed = recurringBillSchema.safeParse({
    name: formData.get("name"),
    amountCents: parseDollarsToCents(String(formData.get("amount") ?? "")),
    categoryId: readCategoryId(formData),
    frequency: formData.get("frequency"),
    nextDueDate: formData.get("nextDueDate"),
    autoPay: formData.get("autoPay") === "on",
    reminderDaysBefore: Number(formData.get("reminderDaysBefore") ?? 3),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error, "Please check your details.") };

  const nextDueDate = new Date(parsed.data.nextDueDate);
  if (Number.isNaN(nextDueDate.getTime())) return { error: "Enter a valid due date." };

  await financeService.createRecurringBill(workspace.id, { ...parsed.data, nextDueDate });
  revalidateFinance();
  return { success: true };
}

export async function updateRecurringBillAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireWorkspace();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing bill." };

  const parsed = recurringBillSchema.safeParse({
    name: formData.get("name"),
    amountCents: parseDollarsToCents(String(formData.get("amount") ?? "")),
    categoryId: readCategoryId(formData),
    frequency: formData.get("frequency"),
    nextDueDate: formData.get("nextDueDate"),
    autoPay: formData.get("autoPay") === "on",
    reminderDaysBefore: Number(formData.get("reminderDaysBefore") ?? 3),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error, "Please check your details.") };

  const nextDueDate = new Date(parsed.data.nextDueDate);
  if (Number.isNaN(nextDueDate.getTime())) return { error: "Enter a valid due date." };

  await financeService.updateRecurringBill(id, { ...parsed.data, nextDueDate });
  revalidateFinance();
  return { success: true };
}

export async function deleteRecurringBillAction(id: string): Promise<ActionResult> {
  await requireWorkspace();
  await financeService.deleteRecurringBill(id);
  revalidateFinance();
  return { success: true };
}

export async function setRecurringBillAutoPayAction(id: string, autoPay: boolean): Promise<ActionResult> {
  await requireWorkspace();
  await financeService.setRecurringBillAutoPay(id, autoPay);
  revalidateFinance();
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/* Savings goals                                                               */
/* -------------------------------------------------------------------------- */

export async function createSavingsGoalAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();

  const targetDateRaw = String(formData.get("targetDate") ?? "");
  const parsed = savingsGoalSchema.safeParse({
    name: formData.get("name"),
    targetAmountCents: parseDollarsToCents(String(formData.get("targetAmount") ?? "")),
    targetDate: targetDateRaw,
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error, "Please check your details.") };

  let targetDate: Date | null = null;
  if (parsed.data.targetDate) {
    targetDate = new Date(parsed.data.targetDate);
    if (Number.isNaN(targetDate.getTime())) return { error: "Enter a valid target date." };
  }

  await financeService.createSavingsGoal(workspace.id, {
    name: parsed.data.name,
    targetAmountCents: parsed.data.targetAmountCents,
    targetDate,
    color: parsed.data.color,
  });
  revalidateFinance();
  return { success: true };
}

export async function updateSavingsGoalAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireWorkspace();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing savings goal." };

  const targetDateRaw = String(formData.get("targetDate") ?? "");
  const parsed = savingsGoalSchema.safeParse({
    name: formData.get("name"),
    targetAmountCents: parseDollarsToCents(String(formData.get("targetAmount") ?? "")),
    targetDate: targetDateRaw,
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error, "Please check your details.") };

  let targetDate: Date | null = null;
  if (parsed.data.targetDate) {
    targetDate = new Date(parsed.data.targetDate);
    if (Number.isNaN(targetDate.getTime())) return { error: "Enter a valid target date." };
  }

  await financeService.updateSavingsGoal(id, {
    name: parsed.data.name,
    targetAmountCents: parsed.data.targetAmountCents,
    targetDate,
    color: parsed.data.color,
  });
  revalidateFinance();
  return { success: true };
}

export async function deleteSavingsGoalAction(id: string): Promise<ActionResult> {
  await requireWorkspace();
  await financeService.deleteSavingsGoal(id);
  revalidateFinance();
  return { success: true };
}

export async function contributeSavingsGoalAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireWorkspace();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing savings goal." };

  const parsed = contributeSchema.safeParse({
    amountCents: parseDollarsToCents(String(formData.get("amount") ?? "")),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error, "Enter a valid amount.") };

  await financeService.contributeSavingsGoal(id, parsed.data.amountCents);
  revalidateFinance();
  return { success: true };
}
