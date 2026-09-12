import { TextInput, View, type TextInputProps } from "react-native";
import { Text } from "./text";
import { useAppTheme } from "@/theme/use-app-theme";

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  const theme = useAppTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text variant="label" color="muted">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={theme.colors.subtleText}
        accessibilityLabel={label}
        style={[
          {
            minHeight: 44,
            borderWidth: 1,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radii.md,
            paddingHorizontal: 14,
            paddingVertical: 10,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            fontSize: 15,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
