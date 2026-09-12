import { View, type ViewProps } from "react-native";
import { useAppTheme } from "@/theme/use-app-theme";

export function Card({ style, ...rest }: ViewProps) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: theme.spacing.md,
        },
        style,
      ]}
      {...rest}
    />
  );
}
