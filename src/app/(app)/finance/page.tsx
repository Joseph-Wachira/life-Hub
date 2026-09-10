import Link from "next/link";
import type { Metadata } from "next";
import { differenceInCalendarDays } from "date-fns";
import { ArrowRight, PiggyBank, Receipt, TrendingDown, TrendingUp } from "lucide-react";
import { requireWorkspace } from "@/lib/session";
import {
  getMonthlyTotals,
  getSpendingByCategory,
  listBudgetsWithSpend,
  listRecurringBills,
  listSavingsGoals,
} from "@/lib/services/finance";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, clamp } from "@/lib/utils";
import { SpendingChart } from "@/components/finance/spending-chart";

export const metadata: Metadata = { title: "Overview · Finance" };

export default async function FinanceOverviewPage() {
  const { workspace } = await requireWorkspace();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [{ incomeCents, expenseCents }, spending, budgets, bills, savingsGoals] = await Promise.all([
    getMonthlyTotals(workspace.id, start, end),
    getSpendingByCategory(workspace.id, start, end),
    listBudgetsWithSpend(workspace.id, start, end),
    listRecurringBills(workspace.id),
    listSavingsGoals(workspace.id),
  ]);

  const upcomingBills = bills
    .filter((b) => differenceInCalendarDays(new Date(b.nextDueDate), now) <= 14)
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Income this month" value={formatCurrency(incomeCents)} icon={TrendingUp} />
        <StatCard label="Expenses this month" value={formatCurrency(expenseCents)} icon={TrendingDown} />
        <StatCard
          label="Net"
          value={formatCurrency(incomeCents - expenseCents)}
          trend={{
            label: incomeCents - expenseCents >= 0 ? "Positive this month" : "Spending more than earning",
            direction: incomeCents - expenseCents >= 0 ? "up" : "down",
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spending by category</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendingChart data={spending} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Budgets</CardTitle>
            <Link href="/finance/budgets" className="flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline">
              Manage <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {budgets.length === 0 ? (
              <p className="text-sm text-[var(--subtle-foreground)]">No budgets set yet.</p>
            ) : (
              budgets.slice(0, 4).map((b) => {
                const pct = b.monthlyLimitCents > 0 ? clamp(Math.round((b.spentCents / b.monthlyLimitCents) * 100), 0, 999) : 0;
                return (
                  <div key={b.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span>{b.category.name}</span>
                      <span className="text-[var(--muted-foreground)]">
                        {formatCurrency(b.spentCents)} / {formatCurrency(b.monthlyLimitCents)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(pct, 100)}
                      indicatorClassName={pct > 100 ? "bg-[var(--danger)]" : pct > 80 ? "bg-[var(--warning)]" : undefined}
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming bills</CardTitle>
            <Link href="/finance/bills" className="flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline">
              Manage <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {upcomingBills.length === 0 ? (
              <p className="text-sm text-[var(--subtle-foreground)]">Nothing due soon.</p>
            ) : (
              upcomingBills.map((bill) => {
                const days = differenceInCalendarDays(new Date(bill.nextDueDate), now);
                return (
                  <div key={bill.id} className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-muted)] text-[var(--brand)]">
                      <Receipt className="size-4" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{bill.name}</span>
                      <span className="text-xs text-[var(--subtle-foreground)]">{formatDate(bill.nextDueDate)}</span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">{formatCurrency(bill.amountCents)}</span>
                    <Badge variant={days < 0 ? "danger" : days <= 3 ? "warning" : "secondary"} className="shrink-0">
                      {days < 0 ? "Overdue" : days === 0 ? "Today" : `${days}d`}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="size-4" /> Savings goals
          </CardTitle>
          <Link href="/finance/savings" className="flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline">
            Manage <ArrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {savingsGoals.length === 0 ? (
            <p className="text-sm text-[var(--subtle-foreground)]">No savings goals yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {savingsGoals.slice(0, 4).map((g) => {
                const pct = g.targetAmountCents > 0 ? clamp(Math.round((g.currentAmountCents / g.targetAmountCents) * 100), 0, 100) : 0;
                return (
                  <div key={g.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: g.color }} />
                        {g.name}
                      </span>
                      <span className="text-[var(--muted-foreground)]">{pct}%</span>
                    </div>
                    <Progress value={pct} />
                    <span className="text-xs text-[var(--subtle-foreground)]">
                      {formatCurrency(g.currentAmountCents)} of {formatCurrency(g.targetAmountCents)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
