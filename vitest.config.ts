import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
    // apps/mobile is a separate Expo/React Native project with its own
    // Jest runner (`npm --prefix apps/mobile test`) — RN source relies on
    // Babel/Flow-aware transforms Vitest's esbuild pipeline doesn't
    // understand, so it must never be picked up here.
    exclude: ["**/node_modules/**", "**/apps/**", "**/packages/**", "**/.git/**"],
  },
});
