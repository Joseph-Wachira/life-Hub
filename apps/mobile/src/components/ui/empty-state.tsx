import { View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Text } from "./text";
import { Button } from "./button";
import { useAppTheme } from "@/theme/use-app-theme";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const theme = useAppTheme();
  return (
    <View style={{ alignItems: "center", justifyContent: "center", gap: theme.spacing.sm, paddingVertical: theme.spacing.xl }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.surfaceSunken,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={22} color={theme.colors.mutedText} />
      </View>
      <Text variant="subtitle" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" color="muted" style={{ textAlign: "center", maxWidth: 280 }}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}
