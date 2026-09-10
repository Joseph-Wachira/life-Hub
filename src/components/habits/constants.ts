import {
  BookOpen,
  Brain,
  CheckCircle,
  Dumbbell,
  Flame,
  Footprints,
  GlassWater,
  Heart,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";

export const HABIT_ICONS: Record<string, LucideIcon> = {
  "check-circle": CheckCircle,
  "glass-water": GlassWater,
  brain: Brain,
  "book-open": BookOpen,
  footprints: Footprints,
  dumbbell: Dumbbell,
  moon: Moon,
  sun: Sun,
  heart: Heart,
  flame: Flame,
};

export const HABIT_ICON_KEYS = Object.keys(HABIT_ICONS);

export const HABIT_COLOR_SWATCHES = [
  "#6366f1",
  "#22c55e",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export const MOOD_META: Record<string, { label: string; emoji: string; value: number }> = {
  VERY_LOW: { label: "Very low", emoji: "😞", value: 1 },
  LOW: { label: "Low", emoji: "🙁", value: 2 },
  NEUTRAL: { label: "Neutral", emoji: "😐", value: 3 },
  GOOD: { label: "Good", emoji: "🙂", value: 4 },
  GREAT: { label: "Great", emoji: "😄", value: 5 },
};

export const MOOD_ORDER = ["VERY_LOW", "LOW", "NEUTRAL", "GOOD", "GREAT"] as const;
