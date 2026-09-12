import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { Text } from "./text";
import { useAppTheme } from "@/theme/use-app-theme";

interface ListRowProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
}

export function ListRow({ title, subtitle, leading, trailing, onPress, showChevron }: ListRowProps) {
  const theme = useAppTheme();

  // Always a Pressable (not conditionally View) — View's `style` prop can't
  // take the `({pressed}) => ...` function form Pressable uses, so switching
  // component type based on `onPress` would break the un-pressable case.
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      hitSlop={onPress ? 4 : undefined}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          minHeight: 44,
          opacity: pressed && onPress ? 0.6 : 1,
        },
      ]}
    >
      {leading}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {showChevron ? <ChevronRight size={18} color={theme.colors.subtleText} /> : null}
    </Pressable>
  );
}
