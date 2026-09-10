import { Briefcase, GraduationCap, Home, Sparkles, Users } from "lucide-react";
import type { WorkspaceType } from "@prisma/client";

export const WORKSPACE_TYPE_META: Record<
  WorkspaceType,
  { label: string; icon: typeof Home; color: string }
> = {
  PERSONAL: { label: "Personal", icon: Sparkles, color: "#6366f1" },
  WORK: { label: "Work", icon: Briefcase, color: "#0ea5e9" },
  SCHOOL: { label: "School", icon: GraduationCap, color: "#8b5cf6" },
  FAMILY: { label: "Family", icon: Users, color: "#f59e0b" },
  SIDE_PROJECT: { label: "Side project", icon: Home, color: "#22c55e" },
};

export const WORKSPACE_TYPE_ORDER: WorkspaceType[] = [
  "PERSONAL",
  "WORK",
  "SCHOOL",
  "FAMILY",
  "SIDE_PROJECT",
];
