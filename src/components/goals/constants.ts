import type { LucideIcon } from "lucide-react";
import { Briefcase, Dumbbell, GraduationCap, PiggyBank, Sparkles } from "lucide-react";
import type { GoalCategory, GoalStatus } from "@prisma/client";

export const GOAL_CATEGORY_ORDER: GoalCategory[] = [
  "PERSONAL",
  "FINANCIAL",
  "FITNESS",
  "CAREER",
  "LEARNING",
];

export const GOAL_CATEGORY_META: Record<GoalCategory, { label: string; icon: LucideIcon }> = {
  PERSONAL: { label: "Personal", icon: Sparkles },
  FINANCIAL: { label: "Financial", icon: PiggyBank },
  FITNESS: { label: "Fitness", icon: Dumbbell },
  CAREER: { label: "Career", icon: Briefcase },
  LEARNING: { label: "Learning", icon: GraduationCap },
};

export const GOAL_STATUS_ORDER: GoalStatus[] = ["ACTIVE", "COMPLETED", "ABANDONED"];

export const GOAL_STATUS_META: Record<
  GoalStatus,
  { label: string; badgeVariant: "default" | "success" | "secondary" }
> = {
  ACTIVE: { label: "Active", badgeVariant: "default" },
  COMPLETED: { label: "Completed", badgeVariant: "success" },
  ABANDONED: { label: "Abandoned", badgeVariant: "secondary" },
};

export const GOAL_COLOR_SWATCHES = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#8b5cf6",
  "#64748b",
];
