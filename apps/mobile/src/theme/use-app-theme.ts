import { useColorScheme } from "@/hooks/use-color-scheme";
import { lightTheme, darkTheme, type AppTheme } from "./tokens";

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}
