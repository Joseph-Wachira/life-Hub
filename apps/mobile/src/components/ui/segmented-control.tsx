import { Pressable, View } from "react-native";
import { Text } from "./text";
import { useAppTheme } from "@/theme/use-app-theme";

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: theme.colors.surfaceSunken,
        borderRadius: theme.radii.md,
        padding: 4,
        gap: 4,
      }}
      accessibilityRole="tablist"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              minHeight: 36,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: theme.radii.sm,
              backgroundColor: selected ? theme.colors.surface : "transparent",
            }}
          >
            <Text variant="label" color={selected ? "default" : "muted"}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
