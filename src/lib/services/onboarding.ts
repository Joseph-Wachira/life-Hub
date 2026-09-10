import type { FocusArea } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Seeds a small, tailored set of starter records so a brand-new workspace
 * never feels completely empty — scoped to whatever the user said they
 * want to manage during onboarding. This is intentionally light; the full
 * realistic demo dataset lives in prisma/seed.ts for the showcase account.
 */
export async function createStarterContent(workspaceId: string, focusAreas: FocusArea[]) {
  const has = (area: FocusArea) => focusAreas.includes(area);
  const in3Days = new Date();
  in3Days.setDate(in3Days.getDate() + 3);
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  await db.$transaction(async (tx) => {
    // Always: a gentle welcome task so Tasks isn't empty on first load.
    await tx.task.create({
      data: {
        workspaceId,
        title: "Take a 2-minute tour of Life Hub",
        description: "Check out your Calendar, Focus timer, and Notes — everything lives here now.",
        priority: "MEDIUM",
        dueAt: in3Days,
      },
    });

    if (has("WORK")) {
      const goal = await tx.goal.create({
        data: {
          workspaceId,
          title: "Grow in my career this year",
          category: "CAREER",
          targetDate: in30Days,
        },
      });
      const project = await tx.project.create({
        data: {
          workspaceId,
          name: "Get organized at work",
          color: "#0ea5e9",
          goalId: goal.id,
        },
      });
      await tx.task.createMany({
        data: [
          {
            workspaceId,
            projectId: project.id,
            title: "List my top 3 priorities for this week",
            priority: "HIGH",
            dueAt: in3Days,
          },
          {
            workspaceId,
            projectId: project.id,
            title: "Block focus time on my calendar",
            priority: "MEDIUM",
            dueAt: in7Days,
          },
        ],
      });
    }

    if (has("EDUCATION")) {
      const goal = await tx.goal.create({
        data: {
          workspaceId,
          title: "Finish this term strong",
          category: "LEARNING",
          targetDate: in30Days,
        },
      });
      const project = await tx.project.create({
        data: {
          workspaceId,
          name: "This semester",
          color: "#8b5cf6",
          goalId: goal.id,
        },
      });
      await tx.task.createMany({
        data: [
          { workspaceId, projectId: project.id, title: "Add my class schedule to the Calendar", priority: "HIGH", dueAt: in3Days },
          { workspaceId, projectId: project.id, title: "Plan study sessions with Focus mode", priority: "MEDIUM", dueAt: in7Days },
        ],
      });
    }

    if (has("PERSONAL")) {
      await tx.note.create({
        data: {
          workspaceId,
          title: "Welcome to Life Hub",
          isPinned: true,
          contentMd:
            "# A few tips\n\n- Drag tasks between columns on your Tasks board\n- Use **Focus** for a distraction-free Pomodoro session\n- Pin notes you'll want to find again\n",
          checklist: {
            create: [
              { text: "Set up your first goal", position: 1000 },
              { text: "Add an upcoming event", position: 2000 },
              { text: "Try a focus session", position: 3000 },
            ],
          },
        },
      });
    }

    if (has("FINANCES")) {
      const [salary, rent, groceries, savingsCat] = await Promise.all([
        tx.category.create({ data: { workspaceId, name: "Salary", type: "INCOME", color: "#22c55e", icon: "wallet" } }),
        tx.category.create({ data: { workspaceId, name: "Rent", type: "EXPENSE", color: "#f97316", icon: "home" } }),
        tx.category.create({ data: { workspaceId, name: "Groceries", type: "EXPENSE", color: "#eab308", icon: "shopping-cart" } }),
        tx.category.create({ data: { workspaceId, name: "Savings", type: "EXPENSE", color: "#06b6d4", icon: "piggy-bank" } }),
      ]);
      await tx.budget.create({ data: { workspaceId, categoryId: groceries.id, monthlyLimitCents: 40000 } });
      await tx.savingsGoal.create({
        data: {
          workspaceId,
          name: "Emergency fund",
          targetAmountCents: 500000,
          currentAmountCents: 0,
          targetDate: in30Days,
        },
      });
      void salary;
      void rent;
      void savingsCat;
    }

    if (has("HEALTH")) {
      await tx.habit.createMany({
        data: [
          { workspaceId, name: "Drink water", icon: "glass-water", color: "#06b6d4", targetPerDay: 8 },
          { workspaceId, name: "Move my body", icon: "footprints", color: "#22c55e", targetPerDay: 1 },
        ],
      });
    }
  });
}
