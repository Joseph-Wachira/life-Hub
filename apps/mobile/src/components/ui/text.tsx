import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { useAppTheme } from "@/theme/use-app-theme";

export type TextVariant = "largeTitle" | "title" | "subtitle" | "body" | "bodyStrong" | "caption" | "label";
export type TextColor = "default" | "muted" | "subtle" | "brand" | "danger" | "success" | "warning" | "onBrand";

const VARIANTS: Record<TextVariant, { fontSize: number; fontWeight: "400" | "500" | "600" | "700"; lineHeight: number }> = {
  largeTitle: { fontSize: 30, fontWeight: "700", lineHeight: 36 },
  title: { fontSize: 22, fontWeight: "700", lineHeight: 28 },
  subtitle: { fontSize: 17, fontWeight: "600", lineHeight: 22 },
  body: { fontSize: 15, fontWeight: "400", lineHeight: 21 },
  bodyStrong: { fontSize: 15, fontWeight: "600", lineHeight: 21 },
  caption: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "600", lineHeight: 16 },
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
}

export function Text({ variant = "body", color = "default", style, ...rest }: TextProps) {
  const theme = useAppTheme();
  const colorMap: Record<TextColor, string> = {
    default: theme.colors.text,
    muted: theme.colors.mutedText,
    subtle: theme.colors.subtleText,
    brand: theme.colors.brand,
    danger: theme.colors.danger,
    success: theme.colors.success,
    warning: theme.colors.warning,
    onBrand: theme.colors.onBrand,
  };
  return <RNText style={[VARIANTS[variant], { color: colorMap[color] }, style]} {...rest} />;
}
