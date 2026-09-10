import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  FolderKanban,
  Target,
  Timer,
  Wallet,
  NotebookText,
  Flame,
  Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/notes", label: "Notes", icon: NotebookText },
  { href: "/habits", label: "Habits", icon: Flame },
] as const;

export const MOBILE_NAV_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[6],
] as const;

export const SETTINGS_NAV_ITEM = { href: "/settings", label: "Settings", icon: Settings } as const;
