/**
 * Hand-rolled design tokens mirroring the web app's CSS custom properties
 * (src/app/globals.css) — same brand indigo, same calm/neutral surfaces —
 * translated to a plain JS object since React Native has no CSS variables.
 * `useAppTheme()` (./use-app-theme.ts) picks light/dark based on the
 * system color scheme.
 */

export const radii = { sm: 8, md: 12, lg: 20, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const brand = {
  indigo: "#6366f1",
  indigoDark: "#818cf8",
};

export const semantic = {
  success: "#22c55e",
  successDark: "#4ade80",
  warning: "#f59e0b",
  warningDark: "#fbbf24",
  danger: "#ef4444",
  dangerDark: "#f87171",
};

export interface AppTheme {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceSunken: string;
    border: string;
    text: string;
    mutedText: string;
    subtleText: string;
    brand: string;
    onBrand: string;
    success: string;
    warning: string;
    danger: string;
    card: string;
    notification: string;
    primary: string;
  };
  radii: typeof radii;
  spacing: typeof spacing;
}

export const lightTheme: AppTheme = {
  dark: false,
  colors: {
    background: "#f7f8fa",
    surface: "#ffffff",
    surfaceSunken: "#eef0f4",
    border: "#e3e6eb",
    text: "#11131a",
    mutedText: "#5b6270",
    subtleText: "#8b93a3",
    brand: brand.indigo,
    onBrand: "#ffffff",
    success: semantic.success,
    warning: semantic.warning,
    danger: semantic.danger,
    card: "#ffffff",
    notification: semantic.danger,
    primary: brand.indigo,
  },
  radii,
  spacing,
};

export const darkTheme: AppTheme = {
  dark: true,
  colors: {
    background: "#0b0c10",
    surface: "#16181f",
    surfaceSunken: "#1d1f28",
    border: "#282b36",
    text: "#f1f2f5",
    mutedText: "#9aa1b1",
    subtleText: "#6b7280",
    brand: brand.indigoDark,
    onBrand: "#0b0c10",
    success: semantic.successDark,
    warning: semantic.warningDark,
    danger: semantic.dangerDark,
    card: "#16181f",
    notification: semantic.dangerDark,
    primary: brand.indigoDark,
  },
  radii,
  spacing,
};

export const priorityColors: Record<"LOW" | "MEDIUM" | "HIGH" | "URGENT", string> = {
  LOW: "#6b7280",
  MEDIUM: brand.indigo,
  HIGH: semantic.warning,
  URGENT: semantic.danger,
};
