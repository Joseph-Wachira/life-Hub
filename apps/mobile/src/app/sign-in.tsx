import { useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppTheme } from "@/theme/use-app-theme";

export default function SignInScreen() {
  const theme = useAppTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("demo@lifehub.app");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  return (
    <Screen scroll={false} edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "center", gap: theme.spacing.xl }}
      >
        <View style={{ gap: 4 }}>
          <Text variant="largeTitle">Life Hub</Text>
          <Text variant="body" color="muted">
            Your calm, all-in-one workspace.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <TextField
            label="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />
          <TextField
            label="Password"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />
          {error ? (
            <Text color="danger" variant="caption">
              {error}
            </Text>
          ) : null}
          <Button label="Sign in" onPress={handleSubmit} loading={loading} fullWidth size="lg" />
        </View>

        <Text variant="caption" color="subtle" style={{ textAlign: "center" }}>
          Demo account: demo@lifehub.app / Demo12345
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}
