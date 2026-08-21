import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const appDirectory = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": appDirectory,
    },
  },
  test: {
    clearMocks: true,
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    setupFiles: ["./tests/unit/setup.ts"],
  },
});
