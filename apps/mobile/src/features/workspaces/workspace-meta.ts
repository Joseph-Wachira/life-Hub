import { Sparkles, Briefcase, GraduationCap, Users, Home, type LucideIcon } from "lucide-react-native";
import type { WorkspaceType } from "@lifehub/shared";

export const WORKSPACE_TYPE_META: Record<WorkspaceType, { label: string; icon: LucideIcon }> = {
  PERSONAL: { label: "Personal", icon: Sparkles },
  WORK: { label: "Work", icon: Briefcase },
  SCHOOL: { label: "School", icon: GraduationCap },
  FAMILY: { label: "Family", icon: Users },
  SIDE_PROJECT: { label: "Side project", icon: Home },
};
