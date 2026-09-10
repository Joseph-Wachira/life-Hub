import Link from "next/link";
import type { Metadata } from "next";
import { endOfDay, startOfDay, differenceInCalendarDays } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Flame,
  Target,
  Timer,
  Wallet,
} from "lucide-react";
import { requireWorkspace } from "@/lib/session";
import { listEventInstancesInRange } from "@/lib/services/events";
import { listTasks } from "@/lib/services/tasks";
import { listGoals, computeGoalProgress } from "@/lib/services/goals";
import { getFocusAnalytics } from "@/lib/services/focus";
import { getMonthlyTotals, listBudgetsWithSpend, listRecurringBills } from "@/lib/services/finance";
import { listActiveHabits, listRecentHabitLogs } from "@/lib/services/habits";
import { auth } from "@/auth";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskQuickToggle } from "@/components/dashboard/task-quick-toggle";
import { HabitsToday, type DashboardHabit } from "@/components/dashboard/habits-today";
import { formatCurrency, formatTime, clamp } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const PRIORITY_RANK: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default async function DashboardPage() {
  const session = await auth();
  const { workspace } = await requireWorkspace();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const now = new Date();

  const [
    todayEvents,
    allTasks,
    goals,
    focusAnalytics,
    monthlyTotals,
    budgets,
    bills,
    habits,
    habitLogs,
  ] = await Promise.all([
    listEventInstancesInRange(workspace.id, startOfDay(now), endOfDay(now)),
    listTasks(workspace.id),
    listGoals(workspace.id),
    getFocusAnalytics(workspace.id, now),
    getMonthlyTotals(workspace.id, new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)),
    listBudgetsWithSpend(workspace.id, new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)),
    listRecurringBills(workspace.id),
    listActiveHabits(workspace.id),
    listRecentHabitLogs(workspace.id, 1),
  ]);

  const openTasks = allTasks.filter((t) => t.status !== "DONE" && t.status !== "ARCHIVED");
  const overdueTasks = openTasks.filter((t) => t.dueAt && new Date(t.dueAt) < now);
  const priorityTasks = [...openTasks]
    .sort((a, b) => {
      const rankDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (rankDiff !== 0) return rankDiff;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    })
    .slice(0, 5);

  const activeGoals = goals.filter((g) => g.status === "ACTIVE").slice(0, 3);

  const overBudget = budgets.filter((b) => b.spentCents > b.monthlyLimitCents);
  const billsDueSoon = bills.filter((b) => differenceInCalendarDays(new Date(b.nextDueDate), now) <= b.reminderDaysBefore);

  const dashboardHabits: DashboardHabit[] = habits.map((h) => {
    const log = habitLogs.find((l) => l.habitId === h.id && new Date(l.date).toDateString() === now.toDateString());
    return {
      id: h.id,
      name: h.name,
      icon: h.icon,
      color: h.color,
      targetPerDay: h.targetPerDay,
      doneToday: (log?.completedCount ?? 0) >= h.targetPerDay,
    };
  });
  const habitsDoneCount = dashboardHabits.filter((h) => h.doneToday).length;

  const insights: { icon: typeof AlertTriangle; text: string; href: string; tone: "danger" | "warning" }[] = [];
  if (overdueTasks.length > 0) {
    insights.push({
      icon: AlertTriangle,
      text: `${overdueTasks.length} overdue ${overdueTasks.length === 1 ? "task" : "tasks"}`,
      href: "/tasks",
      tone: "danger",
    });
  }
  if (billsDueSoon.length > 0) {
    insights.push({
      icon: Wallet,
      text: `${billsDueSoon.length} ${billsDueSoon.length === 1 ? "bill" : "bills"} due soon`,
      href: "/finance/bills",
      tone: "warning",
    });
  }
  if (overBudget.length > 0) {
    insights.push({
      icon: Wallet,
      text: `${overBudget.length} ${overBudget.length === 1 ? "budget is" : "budgets are"} over limit`,
      href: "/finance/budgets",
      tone: "warning",
    });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Here&apos;s your day at a glance.</p>
      </div>

      {insights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {insights.map((insight, i) => (
            <Link
              key={i}
              href={insight.href}
              className={
                insight.tone === "danger"
                  ? "flex items-center gap-1.5 rounded-full bg-[var(--danger)]/10 px-3 py-1.5 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger)]/15"
                  : "flex items-center gap-1.5 rounded-full bg-[var(--warning)]/10 px-3 py-1.5 text-xs font-medium text-[var(--warning)] hover:bg-[var(--warning)]/15"
              }
            >
              <insight.icon className="size-3.5" />
              {insight.text}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Focus today" value={`${focusAnalytics.sessionsToday} session${focusAnalytics.sessionsToday === 1 ? "" : "s"}`} icon={Timer} />
        <StatCard label="This month" value={formatCurrency(monthlyTotals.incomeCents - monthlyTotals.expenseCents)} icon={Wallet} trend={{ label: "Net income", direction: monthlyTotals.incomeCents >= monthlyTotals.expenseCents ? "up" : "down" }} />
        <StatCard label="Habits today" value={`${habitsDoneCount}/${dashboardHabits.length}`} icon={Flame} />
        <StatCard label="Active goals" value={String(activeGoals.length)} icon={Target} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="size-4" /> Today&apos;s schedule
            </CardTitle>
            <Link href="/calendar" className="flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline">
              Open calendar <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {todayEvents.length === 0 ? (
              <EmptyState icon={CalendarIcon} title="Nothing scheduled today" description="Enjoy the open time, or add something to your calendar." className="py-6" />
            ) : (
              <div className="flex flex-col gap-2">
                {todayEvents.map((instance) => (
                  <div key={instance.instanceId} className="flex items-center gap-3 text-sm">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: instance.event.color }} />
                    <span className="w-16 shrink-0 text-xs text-[var(--subtle-foreground)]">
                      {instance.event.allDay ? "All day" : formatTime(instance.start)}
                    </span>
                    <span className="truncate">{instance.event.title}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-4" /> Priority tasks
            </CardTitle>
            <Link href="/tasks" className="flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {priorityTasks.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="All caught up" description="No open tasks need your attention right now." className="py-6" />
            ) : (
              <div className="flex flex-col gap-2">
                {priorityTasks.map((task) => {
                  const isOverdue = !!task.dueAt && new Date(task.dueAt) < now;
                  return (
                    <div key={task.id} className="flex items-center gap-3">
                      <TaskQuickToggle taskId={task.id} done={false} />
                      <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
                      {isOverdue && (
                        <Badge variant="danger" className="gap-1">
                          <AlertTriangle className="size-3" /> overdue
                        </Badge>
                      )}
                      <Badge
                        variant={
                          task.priority === "URGENT"
                            ? "danger"
                            : task.priority === "HIGH"
                              ? "warning"
                              : task.priority === "MEDIUM"
                                ? "default"
                                : "secondary"
                        }
                      >
                        {task.priority.toLowerCase()}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-4" /> Habits today
            </CardTitle>
            <Link href="/habits" className="flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline">
              Manage <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {dashboardHabits.length === 0 ? (
              <EmptyState icon={Flame} title="No habits yet" description="Add a habit to start building streaks." className="py-6" />
            ) : (
              <HabitsToday habits={dashboardHabits} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4" /> Goals in progress
            </CardTitle>
            <Link href="/goals" className="flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {activeGoals.length === 0 ? (
              <EmptyState icon={Target} title="No active goals" description="Set a goal to start tracking progress." className="py-6" />
            ) : (
              <div className="flex flex-col gap-3">
                {activeGoals.map((goal) => {
                  const progress = computeGoalProgress(goal);
                  return (
                    <Link key={goal.id} href={`/goals/${goal.id}`} className="flex flex-col gap-1.5 rounded-[var(--radius-sm)] p-1 hover:bg-[var(--surface-sunken)]">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 truncate">
                          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: goal.color }} />
                          {goal.title}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">{progress}%</span>
                      </div>
                      <Progress value={clamp(progress, 0, 100)} />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
