import { View } from "react-native";
import { useAppTheme } from "@/theme/use-app-theme";

export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: "brand" | "danger" | "warning" | "success" }) {
  const theme = useAppTheme();
  const clamped = Math.max(0, Math.min(100, value));
  const color = { brand: theme.colors.brand, danger: theme.colors.danger, warning: theme.colors.warning, success: theme.colors.success }[
    tone
  ];

  return (
    <View
      style={{ height: 6, borderRadius: theme.radii.pill, backgroundColor: theme.colors.surfaceSunken, overflow: "hidden" }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
    >
      <View style={{ width: `${clamped}%`, height: "100%", backgroundColor: color, borderRadius: theme.radii.pill }} />
    </View>
  );
}
