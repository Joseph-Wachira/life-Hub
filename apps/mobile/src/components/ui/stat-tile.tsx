import { View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Text } from "./text";
import { Card } from "./card";
import { useAppTheme } from "@/theme/use-app-theme";

interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "brand" | "success" | "warning" | "danger";
}

export function StatTile({ label, value, icon: Icon, tone = "brand" }: StatTileProps) {
  const theme = useAppTheme();
  const color = { brand: theme.colors.brand, success: theme.colors.success, warning: theme.colors.warning, danger: theme.colors.danger }[
    tone
  ];

  return (
    <Card style={{ flex: 1, gap: theme.spacing.sm }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: theme.radii.sm,
          backgroundColor: `${color}1a`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={16} color={color} />
      </View>
      <Text variant="title">{value}</Text>
      <Text variant="caption" color="muted">
        {label}
      </Text>
    </Card>
  );
}
