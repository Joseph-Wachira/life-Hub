import { View } from "react-native";
import { Text } from "./text";
import { useAppTheme } from "@/theme/use-app-theme";

type Tone = "brand" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  label: string;
  tone?: Tone;
}

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const theme = useAppTheme();
  const color: Record<Tone, string> = {
    brand: theme.colors.brand,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    neutral: theme.colors.mutedText,
  };
  return (
    <View
      style={{
        backgroundColor: `${color[tone]}1a`,
        borderRadius: theme.radii.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
      }}
    >
      <Text variant="label" style={{ color: color[tone] }}>
        {label}
      </Text>
    </View>
  );
}
