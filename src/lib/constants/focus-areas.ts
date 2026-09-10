import { Briefcase, GraduationCap, Heart, Sparkles, Wallet } from "lucide-react";
import type { FocusArea } from "@prisma/client";

export const FOCUS_AREA_META: Record<
  FocusArea,
  { label: string; description: string; icon: typeof Briefcase }
> = {
  WORK: {
    label: "Work",
    description: "Meetings, deadlines, and career goals",
    icon: Briefcase,
  },
  EDUCATION: {
    label: "Education",
    description: "Classes, assignments, and study goals",
    icon: GraduationCap,
  },
  PERSONAL: {
    label: "Personal life",
    description: "Errands, routines, and personal projects",
    icon: Sparkles,
  },
  FINANCES: {
    label: "Finances",
    description: "Budgets, bills, and savings goals",
    icon: Wallet,
  },
  HEALTH: {
    label: "Health & wellbeing",
    description: "Habits, mood, sleep, and exercise",
    icon: Heart,
  },
};

export const FOCUS_AREA_ORDER: FocusArea[] = [
  "WORK",
  "EDUCATION",
  "PERSONAL",
  "FINANCES",
  "HEALTH",
];

export const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "employee", label: "Employee" },
  { value: "freelancer", label: "Freelancer" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "parent", label: "Parent / family manager" },
  { value: "other", label: "Something else" },
] as const;
