import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Exclude Playwright tests (they run separately with playwright test)
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/tests/fuzz/**",
    ],
  },
});
