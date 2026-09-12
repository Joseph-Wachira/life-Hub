import { Tabs } from "expo-router";
import { Sun, ListChecks, Timer, Wallet, Menu } from "lucide-react-native";
import { useAppTheme } from "@/theme/use-app-theme";

export default function TabsLayout() {
  const theme = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: theme.colors.mutedText,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Today", tabBarIcon: ({ color, size }) => <Sun color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="plan"
        options={{ title: "Plan", tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="focus"
        options={{ title: "Focus", tabBarIcon: ({ color, size }) => <Timer color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="finance"
        options={{ title: "Finance", tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: "More", tabBarIcon: ({ color, size }) => <Menu color={color} size={size} /> }}
      />
    </Tabs>
  );
}
