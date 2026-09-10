/**
 * Realistic demo data for Life Hub.
 *
 * Run with `npm run db:seed`. Safe to re-run — it deletes and recreates the
 * demo account (cascades clean up everything scoped to it) so you always
 * get a fresh, fully-populated workspace to explore.
 *
 * Demo login: demo@lifehub.app / Demo12345
 */
import { PrismaClient, type FocusArea, type TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_EMAIL = "demo@lifehub.app";
const DEMO_PASSWORD = "Demo12345";

const DAY_MS = 24 * 60 * 60 * 1000;

function atTime(base: Date, hour: number, minute = 0) {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function daysAgo(n: number, hour = 9, minute = 0) {
  const now = new Date();
  const d = new Date(now.getTime() - n * DAY_MS);
  return atTime(d, hour, minute);
}

function daysFromNow(n: number, hour = 9, minute = 0) {
  return daysAgo(-n, hour, minute);
}

function midnight(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(probability: number) {
  return Math.random() < probability;
}

function money(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) * 100);
}

async function main() {
  console.log("Seeding Life Hub demo data…");

  await db.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const focusAreas: FocusArea[] = ["WORK", "PERSONAL", "FINANCES", "HEALTH"];

  const user = await db.user.create({
    data: {
      name: "Jordan Rivera",
      email: DEMO_EMAIL,
      passwordHash,
      settings: { create: {} },
      notificationPref: { create: {} },
      onboardingProfile: {
        create: {
          focusAreasJson: JSON.stringify(focusAreas),
          role: "freelancer",
          completedAt: daysAgo(60),
        },
      },
    },
  });

  const personal = await db.workspace.create({
    data: { userId: user.id, name: "Personal", type: "PERSONAL", color: "#6366f1", isDefault: true },
  });
  const work = await db.workspace.create({
    data: { userId: user.id, name: "Work", type: "WORK", color: "#0ea5e9" },
  });
  const sideProject = await db.workspace.create({
    data: { userId: user.id, name: "Side Project", type: "SIDE_PROJECT", color: "#22c55e" },
  });

  // -------------------------------------------------------------------
  // Tags
  // -------------------------------------------------------------------
  const [tagErrands, tagUrgent, tagSomeday] = await Promise.all([
    db.tag.create({ data: { workspaceId: personal.id, name: "errands", color: "#f59e0b" } }),
    db.tag.create({ data: { workspaceId: personal.id, name: "urgent", color: "#ef4444" } }),
    db.tag.create({ data: { workspaceId: personal.id, name: "someday", color: "#8b5cf6" } }),
  ]);
  const [tagClientA, tagUrgentWork] = await Promise.all([
    db.tag.create({ data: { workspaceId: work.id, name: "client-a", color: "#0ea5e9" } }),
    db.tag.create({ data: { workspaceId: work.id, name: "urgent", color: "#ef4444" } }),
  ]);

  // -------------------------------------------------------------------
  // Goals & milestones
  // -------------------------------------------------------------------
  const readingGoal = await db.goal.create({
    data: {
      workspaceId: personal.id,
      title: "Read 20 books this year",
      description: "A mix of fiction and non-fiction, at least two per month.",
      category: "PERSONAL",
      targetDate: daysFromNow(150),
      color: "#8b5cf6",
      milestones: {
        create: [
          { title: "Finish 5 books", completedAt: daysAgo(40), position: 1000 },
          { title: "Finish 10 books", completedAt: daysAgo(5), position: 2000 },
          { title: "Finish 15 books", position: 3000 },
          { title: "Finish 20 books", position: 4000 },
        ],
      },
    },
  });

  const run10kGoal = await db.goal.create({
    data: {
      workspaceId: personal.id,
      title: "Run a 10k",
      description: "Build up from 5k over three months.",
      category: "FITNESS",
      targetDate: daysFromNow(45),
      color: "#22c55e",
      milestones: {
        create: [
          { title: "Run 5k without stopping", completedAt: daysAgo(20), position: 1000 },
          { title: "Run 7k", position: 2000 },
          { title: "Run 10k", position: 3000 },
        ],
      },
    },
  });

  const emergencyFundGoal = await db.goal.create({
    data: {
      workspaceId: personal.id,
      title: "Build a 6-month emergency fund",
      category: "FINANCIAL",
      targetDate: daysFromNow(200),
      color: "#06b6d4",
      milestones: {
        create: [
          { title: "Save first $1,000", completedAt: daysAgo(50), position: 1000 },
          { title: "Save $3,000", completedAt: daysAgo(10), position: 2000 },
          { title: "Reach $6,000", position: 3000 },
        ],
      },
    },
  });

  const learnTsGoal = await db.goal.create({
    data: {
      workspaceId: personal.id,
      title: "Get fluent in TypeScript",
      category: "LEARNING",
      targetDate: daysFromNow(90),
      color: "#f59e0b",
      milestones: {
        create: [
          { title: "Finish the handbook", completedAt: daysAgo(15), position: 1000 },
          { title: "Build a typed side project", position: 2000 },
        ],
      },
    },
  });

  const careerGoal = await db.goal.create({
    data: {
      workspaceId: work.id,
      title: "Land two new retainer clients",
      category: "CAREER",
      targetDate: daysFromNow(60),
      color: "#0ea5e9",
      milestones: {
        create: [
          { title: "Refresh portfolio site", completedAt: daysAgo(8), position: 1000 },
          { title: "Sign client #1", position: 2000 },
          { title: "Sign client #2", position: 3000 },
        ],
      },
    },
  });

  // -------------------------------------------------------------------
  // Projects
  // -------------------------------------------------------------------
  const renovationProject = await db.project.create({
    data: {
      workspaceId: personal.id,
      name: "Home renovation",
      description: "Slowly turning the spare room into an office.",
      color: "#f59e0b",
      status: "ACTIVE",
      startAt: daysAgo(30),
      dueAt: daysFromNow(60),
    },
  });

  const websiteProject = await db.project.create({
    data: {
      workspaceId: sideProject.id,
      name: "Personal website v2",
      description: "Rebuilding the portfolio with a cleaner design.",
      color: "#22c55e",
      status: "ACTIVE",
      startAt: daysAgo(21),
      dueAt: daysFromNow(30),
    },
  });

  const redesignProject = await db.project.create({
    data: {
      workspaceId: work.id,
      name: "Q3 website redesign",
      description: "Full redesign for a client in the wellness space.",
      color: "#0ea5e9",
      status: "ACTIVE",
      goalId: careerGoal.id,
      startAt: daysAgo(25),
      dueAt: daysFromNow(20),
    },
  });

  const onboardingRevamp = await db.project.create({
    data: {
      workspaceId: work.id,
      name: "Client onboarding revamp",
      description: "Streamlining the new-client kickoff process.",
      color: "#6366f1",
      status: "ON_HOLD",
    },
  });

  // -------------------------------------------------------------------
  // Tasks (with a few subtasks)
  // -------------------------------------------------------------------
  const personalTasks: { title: string; status: "TODO" | "IN_PROGRESS" | "DONE"; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; dueAt?: Date; projectId?: string; goalId?: string; tagIds?: string[] }[] = [
    { title: "Pick paint colors for the office", status: "TODO", priority: "MEDIUM", dueAt: daysFromNow(4), projectId: renovationProject.id, tagIds: [tagErrands.id] },
    { title: "Order a standing desk", status: "TODO", priority: "HIGH", dueAt: daysFromNow(2), projectId: renovationProject.id, tagIds: [tagUrgent.id] },
    { title: "Install office shelving", status: "IN_PROGRESS", priority: "MEDIUM", dueAt: daysFromNow(10), projectId: renovationProject.id },
    { title: "Patch and sand the walls", status: "DONE", priority: "LOW", projectId: renovationProject.id },
    { title: "Renew passport", status: "TODO", priority: "URGENT", dueAt: daysFromNow(1), tagIds: [tagUrgent.id, tagErrands.id] },
    { title: "Book dentist appointment", status: "TODO", priority: "MEDIUM", dueAt: daysFromNow(6), tagIds: [tagErrands.id] },
    { title: "Finish 'Atomic Habits'", status: "IN_PROGRESS", priority: "LOW", goalId: readingGoal.id, dueAt: daysFromNow(7) },
    { title: "Sign up for the 10k race", status: "TODO", priority: "MEDIUM", goalId: run10kGoal.id, dueAt: daysFromNow(14) },
    { title: "Automate savings transfer", status: "DONE", priority: "MEDIUM", goalId: emergencyFundGoal.id },
    { title: "Finish TypeScript generics chapter", status: "TODO", priority: "LOW", goalId: learnTsGoal.id, dueAt: daysFromNow(5) },
    { title: "Plan weekend trip itinerary", status: "TODO", priority: "LOW", tagIds: [tagSomeday.id], dueAt: daysFromNow(20) },
    { title: "Overdue: return library books", status: "TODO", priority: "MEDIUM", dueAt: daysAgo(2) },
  ];

  for (const t of personalTasks) {
    await db.task.create({
      data: {
        workspaceId: personal.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueAt: t.dueAt,
        projectId: t.projectId,
        goalId: t.goalId,
        completedAt: t.status === "DONE" ? daysAgo(3) : undefined,
        tags: t.tagIds ? { connect: t.tagIds.map((id) => ({ id })) } : undefined,
      },
    });
  }

  const wireframeTask = await db.task.create({
    data: {
      workspaceId: work.id,
      title: "Wireframe the new homepage",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueAt: daysFromNow(3),
      projectId: redesignProject.id,
      tags: { connect: [{ id: tagClientA.id }] },
    },
  });
  await db.task.createMany({
    data: [
      { workspaceId: work.id, title: "Review homepage copy draft", status: "TODO", priority: "MEDIUM", dueAt: daysFromNow(5), projectId: redesignProject.id, parentTaskId: wireframeTask.id },
      { workspaceId: work.id, title: "Get feedback from stakeholders", status: "TODO", priority: "MEDIUM", dueAt: daysFromNow(6), projectId: redesignProject.id, parentTaskId: wireframeTask.id },
    ],
  });
  await db.task.createMany({
    data: [
      { workspaceId: work.id, title: "Send invoice for August", status: "TODO", priority: "URGENT", dueAt: daysFromNow(1) },
      { workspaceId: work.id, title: "Prep client kickoff deck", status: "TODO", priority: "HIGH", dueAt: daysFromNow(2), projectId: onboardingRevamp.id },
      { workspaceId: work.id, title: "Reply to client A feedback", status: "DONE", priority: "MEDIUM", completedAt: daysAgo(1) },
      { workspaceId: work.id, title: "Draft proposal for lead #2", status: "TODO", priority: "HIGH", dueAt: daysFromNow(4), goalId: careerGoal.id },
    ],
  });
  await db.task.update({
    where: { id: (await db.task.findFirst({ where: { workspaceId: work.id, title: "Send invoice for August" } }))!.id },
    data: { tags: { connect: [{ id: tagUrgentWork.id }] } },
  });

  await db.task.createMany({
    data: [
      { workspaceId: sideProject.id, title: "Set up new design tokens", status: "DONE", priority: "MEDIUM", projectId: websiteProject.id, completedAt: daysAgo(6) },
      { workspaceId: sideProject.id, title: "Rebuild the projects grid", status: "IN_PROGRESS", priority: "MEDIUM", projectId: websiteProject.id, dueAt: daysFromNow(8) },
      { workspaceId: sideProject.id, title: "Write case study for Life Hub", status: "TODO", priority: "LOW", projectId: websiteProject.id, dueAt: daysFromNow(25) },
    ],
  });

  // -------------------------------------------------------------------
  // Calendar events
  // -------------------------------------------------------------------
  await db.event.createMany({
    data: [
      { workspaceId: personal.id, title: "Morning run", startAt: daysFromNow(0, 7), endAt: daysFromNow(0, 7, 45), color: "#22c55e" },
      { workspaceId: personal.id, title: "Dentist appointment", startAt: daysFromNow(6, 14), endAt: daysFromNow(6, 15), color: "#ef4444", reminderMinutesBefore: 60 },
      { workspaceId: personal.id, title: "Dinner with Sam", startAt: daysFromNow(3, 19), endAt: daysFromNow(3, 21), color: "#f59e0b" },
      { workspaceId: personal.id, title: "Weekend trip planning", startAt: daysFromNow(20, 10), endAt: daysFromNow(20, 11), color: "#8b5cf6" },
      { workspaceId: work.id, title: "Client A check-in", startAt: daysFromNow(0, 11), endAt: daysFromNow(0, 11, 30), color: "#0ea5e9", reminderMinutesBefore: 15 },
      { workspaceId: work.id, title: "Design review", startAt: daysFromNow(2, 15), endAt: daysFromNow(2, 16), color: "#6366f1" },
      { workspaceId: work.id, title: "Kickoff call — new lead", startAt: daysFromNow(4, 13), endAt: daysFromNow(4, 14), color: "#22c55e" },
      {
        workspaceId: work.id,
        title: "Team standup",
        startAt: daysFromNow(0, 9),
        endAt: daysFromNow(0, 9, 15),
        color: "#0ea5e9",
        recurrenceRuleJson: JSON.stringify({ freq: "WEEKLY", interval: 1, byWeekday: [1, 2, 3, 4, 5] }),
        recurrenceEndAt: daysFromNow(90),
      },
    ],
  });

  // -------------------------------------------------------------------
  // Finance: categories, transactions, budgets, bills, savings goals
  // -------------------------------------------------------------------
  const incomeCats = await Promise.all([
    db.category.create({ data: { workspaceId: personal.id, name: "Salary", type: "INCOME", color: "#22c55e", icon: "wallet" } }),
    db.category.create({ data: { workspaceId: personal.id, name: "Freelance", type: "INCOME", color: "#06b6d4", icon: "briefcase" } }),
  ]);
  const expenseCatDefs = [
    { name: "Rent", color: "#f97316", icon: "home" },
    { name: "Groceries", color: "#eab308", icon: "shopping-cart" },
    { name: "Dining Out", color: "#ec4899", icon: "utensils" },
    { name: "Transportation", color: "#3b82f6", icon: "car" },
    { name: "Utilities", color: "#64748b", icon: "plug" },
    { name: "Entertainment", color: "#a855f7", icon: "film" },
    { name: "Savings", color: "#06b6d4", icon: "piggy-bank" },
  ];
  const expenseCats = await Promise.all(
    expenseCatDefs.map((c) => db.category.create({ data: { workspaceId: personal.id, name: c.name, type: "EXPENSE" as TransactionType, color: c.color, icon: c.icon } }))
  );
  const [rentCat, groceriesCat, diningCat, transportCat, utilitiesCat, entertainmentCat, savingsCat] = expenseCats;
  const [salaryCat, freelanceCat] = incomeCats;

  const transactions: { workspaceId: string; type: TransactionType; amountCents: number; categoryId: string; description: string; occurredAt: Date }[] = [];

  for (let d = 89; d >= 0; d--) {
    const date = daysAgo(d, 12);
    const dayOfMonth = date.getDate();

    if (dayOfMonth === 1 || dayOfMonth === 15) {
      transactions.push({ workspaceId: personal.id, type: "INCOME", amountCents: money(2150, 2250), categoryId: salaryCat.id, description: "Paycheck", occurredAt: date });
    }
    if (dayOfMonth === 1) {
      transactions.push({ workspaceId: personal.id, type: "EXPENSE", amountCents: 145000, categoryId: rentCat.id, description: "Monthly rent", occurredAt: date });
      transactions.push({ workspaceId: personal.id, type: "EXPENSE", amountCents: money(85, 130), categoryId: utilitiesCat.id, description: "Electricity & water", occurredAt: date });
      transactions.push({ workspaceId: personal.id, type: "EXPENSE", amountCents: money(200, 400), categoryId: savingsCat.id, description: "Transfer to savings", occurredAt: date });
    }
    if (chance(0.12)) {
      transactions.push({ workspaceId: personal.id, type: "INCOME", amountCents: money(150, 600), categoryId: freelanceCat.id, description: pick(["Freelance invoice", "Consulting session", "Side project payout"]), occurredAt: date });
    }
    if (chance(0.35)) {
      transactions.push({ workspaceId: personal.id, type: "EXPENSE", amountCents: money(25, 95), categoryId: groceriesCat.id, description: pick(["Grocery run", "Farmers market", "Whole Foods"]), occurredAt: date });
    }
    if (chance(0.3)) {
      transactions.push({ workspaceId: personal.id, type: "EXPENSE", amountCents: money(12, 55), categoryId: diningCat.id, description: pick(["Coffee shop", "Lunch out", "Dinner with friends", "Takeout"]), occurredAt: date });
    }
    if (chance(0.25)) {
      transactions.push({ workspaceId: personal.id, type: "EXPENSE", amountCents: money(10, 60), categoryId: transportCat.id, description: pick(["Gas", "Rideshare", "Transit pass"]), occurredAt: date });
    }
    if (chance(0.12)) {
      transactions.push({ workspaceId: personal.id, type: "EXPENSE", amountCents: money(10, 45), categoryId: entertainmentCat.id, description: pick(["Movie night", "Streaming subscription", "Concert tickets", "Books"]), occurredAt: date });
    }
  }
  await db.transaction.createMany({ data: transactions });

  await db.budget.createMany({
    data: [
      { workspaceId: personal.id, categoryId: groceriesCat.id, monthlyLimitCents: 45000 },
      { workspaceId: personal.id, categoryId: diningCat.id, monthlyLimitCents: 25000 },
      { workspaceId: personal.id, categoryId: transportCat.id, monthlyLimitCents: 15000 },
      { workspaceId: personal.id, categoryId: entertainmentCat.id, monthlyLimitCents: 12000 },
    ],
  });

  await db.recurringBill.createMany({
    data: [
      { workspaceId: personal.id, name: "Rent", amountCents: 145000, categoryId: rentCat.id, frequency: "MONTHLY", nextDueDate: daysFromNow(21), autoPay: true, reminderDaysBefore: 5 },
      { workspaceId: personal.id, name: "Netflix", amountCents: 1599, categoryId: entertainmentCat.id, frequency: "MONTHLY", nextDueDate: daysFromNow(9), autoPay: true, reminderDaysBefore: 2 },
      { workspaceId: personal.id, name: "Gym membership", amountCents: 4500, categoryId: entertainmentCat.id, frequency: "MONTHLY", nextDueDate: daysFromNow(2), autoPay: false, reminderDaysBefore: 3 },
      { workspaceId: personal.id, name: "Car insurance", amountCents: 62000, categoryId: transportCat.id, frequency: "YEARLY", nextDueDate: daysFromNow(45), autoPay: false, reminderDaysBefore: 14 },
    ],
  });

  await db.savingsGoal.createMany({
    data: [
      { workspaceId: personal.id, name: "Emergency fund", targetAmountCents: 600000, currentAmountCents: 320000, targetDate: daysFromNow(200), color: "#06b6d4", icon: "shield" },
      { workspaceId: personal.id, name: "Trip to Japan", targetAmountCents: 300000, currentAmountCents: 95000, targetDate: daysFromNow(150), color: "#f59e0b", icon: "plane" },
    ],
  });

  // -------------------------------------------------------------------
  // Focus sessions
  // -------------------------------------------------------------------
  const focusTaskIds = [wireframeTask.id];
  for (let d = 13; d >= 0; d--) {
    if (chance(0.75)) {
      const sessions = 1 + Math.floor(Math.random() * 3);
      for (let s = 0; s < sessions; s++) {
        const planned = pick([25, 25, 25, 50]);
        const completed = chance(0.85);
        await db.focusSession.create({
          data: {
            workspaceId: chance(0.5) ? work.id : personal.id,
            userId: user.id,
            type: planned === 50 ? "DEEP_WORK" : "POMODORO",
            plannedMinutes: planned,
            actualMinutes: completed ? planned : Math.round(planned * 0.6),
            startedAt: daysAgo(d, 9 + s * 2),
            endedAt: daysAgo(d, 9 + s * 2, planned),
            taskId: chance(0.4) ? pick(focusTaskIds) : undefined,
            interruptions: Math.floor(Math.random() * 3),
            rating: completed ? 3 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 2),
            notes: chance(0.3) ? pick(["Deep focus, no distractions.", "Got interrupted twice by Slack.", "Great flow state today.", "Struggled to concentrate."]) : undefined,
          },
        });
      }
    }
  }

  // -------------------------------------------------------------------
  // Notes
  // -------------------------------------------------------------------
  const ideasFolder = await db.noteFolder.create({ data: { workspaceId: personal.id, name: "Ideas", color: "#8b5cf6" } });
  const journalFolder = await db.noteFolder.create({ data: { workspaceId: personal.id, name: "Journal", color: "#06b6d4" } });

  await db.note.create({
    data: {
      workspaceId: personal.id,
      folderId: ideasFolder.id,
      title: "Home office layout ideas",
      isPinned: true,
      tags: { connect: [{ id: tagSomeday.id }] },
      contentMd:
        "# Layout options\n\n- L-shaped desk against the window\n- Bookshelf as a room divider\n- Add a small reading nook in the corner\n\nRevisit once the shelving is installed.",
      checklist: {
        create: [
          { text: "Measure the room", checked: true, position: 1000 },
          { text: "Order the desk", checked: false, position: 2000 },
          { text: "Pick a rug", checked: false, position: 3000 },
        ],
      },
    },
  });

  await db.note.create({
    data: {
      workspaceId: personal.id,
      folderId: journalFolder.id,
      title: "Weekly reflection",
      contentMd:
        "Good week overall. Focus sessions are finally sticking as a habit, and the 10k training is going better than expected. Need to be more consistent with meal prep.",
    },
  });

  await db.note.create({
    data: {
      workspaceId: work.id,
      title: "Client A meeting notes",
      isPinned: true,
      tags: { connect: [{ id: tagClientA.id }] },
      projectId: redesignProject.id,
      contentMd:
        "## Key takeaways\n\n- Wants a warmer color palette\n- Homepage hero needs a clearer CTA\n- Launch target pushed back two weeks\n\n### Action items\n- Send revised mockups by Friday",
    },
  });

  // -------------------------------------------------------------------
  // Habits, mood, wellbeing
  // -------------------------------------------------------------------
  const waterHabit = await db.habit.create({ data: { workspaceId: personal.id, name: "Drink water", icon: "glass-water", color: "#06b6d4", targetPerDay: 8 } });
  const meditateHabit = await db.habit.create({ data: { workspaceId: personal.id, name: "Meditate", icon: "brain", color: "#8b5cf6", targetPerDay: 1 } });
  const readHabit = await db.habit.create({ data: { workspaceId: personal.id, name: "Read", icon: "book-open", color: "#f59e0b", targetPerDay: 1 } });
  const exerciseHabit = await db.habit.create({
    data: {
      workspaceId: personal.id,
      name: "Exercise",
      icon: "footprints",
      color: "#22c55e",
      targetPerDay: 1,
      daysOfWeekJson: JSON.stringify([1, 2, 3, 4, 5]),
    },
  });

  const moods = ["GOOD", "GREAT", "NEUTRAL", "GOOD", "LOW", "GREAT", "GOOD"] as const;

  for (let d = 29; d >= 0; d--) {
    const date = midnight(daysAgo(d));

    if (chance(0.85)) await db.habitLog.create({ data: { habitId: waterHabit.id, date, completedCount: 5 + Math.floor(Math.random() * 4) } });
    if (chance(0.7)) await db.habitLog.create({ data: { habitId: meditateHabit.id, date, completedCount: 1 } });
    if (chance(0.6)) await db.habitLog.create({ data: { habitId: readHabit.id, date, completedCount: 1 } });
    if (date.getDay() >= 1 && date.getDay() <= 5 && chance(0.65)) {
      await db.habitLog.create({ data: { habitId: exerciseHabit.id, date, completedCount: 1 } });
    }

    if (chance(0.8)) {
      await db.moodCheckIn.create({
        data: { workspaceId: personal.id, date, mood: pick([...moods]), energyLevel: 2 + Math.floor(Math.random() * 4) },
      });
    }

    if (chance(0.75)) {
      await db.wellbeingLog.create({
        data: {
          workspaceId: personal.id,
          date,
          sleepHours: Math.round((6 + Math.random() * 2.5) * 10) / 10,
          exerciseMinutes: chance(0.5) ? 20 + Math.floor(Math.random() * 40) : 0,
          waterMl: 1200 + Math.floor(Math.random() * 1500),
        },
      });
    }
  }

  // -------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------
  await db.notification.createMany({
    data: [
      {
        userId: user.id,
        workspaceId: personal.id,
        type: "BILL_DUE",
        title: "Gym membership due in 2 days",
        body: "$45.00 will be charged automatically.",
        entityType: "RecurringBill",
        scheduledFor: daysFromNow(0),
        isRead: false,
      },
      {
        userId: user.id,
        workspaceId: personal.id,
        type: "TASK_DUE",
        title: "\"Renew passport\" is due tomorrow",
        entityType: "Task",
        scheduledFor: daysFromNow(0),
        isRead: false,
      },
      {
        userId: user.id,
        workspaceId: work.id,
        type: "EVENT_REMINDER",
        title: "Client A check-in starts in 15 minutes",
        entityType: "Event",
        scheduledFor: daysFromNow(0),
        isRead: false,
      },
      {
        userId: user.id,
        workspaceId: personal.id,
        type: "GOAL_MILESTONE",
        title: "You completed a milestone: \"Save $3,000\"",
        entityType: "Milestone",
        scheduledFor: daysAgo(10),
        isRead: true,
      },
      {
        userId: user.id,
        workspaceId: personal.id,
        type: "HABIT_REMINDER",
        title: "Don't forget to log today's habits",
        entityType: "Habit",
        scheduledFor: daysAgo(1),
        isRead: true,
      },
    ],
  });

  console.log("Seed complete.");
  console.log(`  Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
