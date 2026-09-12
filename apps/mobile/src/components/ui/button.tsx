import type { ReactNode } from "react";
import { Pressable, ActivityIndicator, StyleSheet, type GestureResponderEvent } from "react-native";
import { Text } from "./text";
import { useAppTheme } from "@/theme/use-app-theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

interface ButtonProps {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  icon,
  fullWidth,
  accessibilityHint,
}: ButtonProps) {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;

  const backgroundColor: Record<Variant, string> = {
    primary: theme.colors.brand,
    secondary: theme.colors.surfaceSunken,
    ghost: "transparent",
    danger: theme.colors.danger,
  };
  const textColor: Record<Variant, string> = {
    primary: theme.colors.onBrand,
    secondary: theme.colors.text,
    ghost: theme.colors.brand,
    danger: "#ffffff",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityHint={accessibilityHint}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: backgroundColor[variant],
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          paddingVertical: size === "lg" ? 16 : 12,
          borderRadius: theme.radii.md,
          width: fullWidth ? "100%" : undefined,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} />
      ) : (
        <>
          {icon}
          <Text variant="bodyStrong" style={{ color: textColor[variant] }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 20,
  },
});
