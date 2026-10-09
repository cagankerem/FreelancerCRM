import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

// The runtime harness owns the built workerd process; never fall back to Next dev.
export default defineConfig({
  ...config,
  webServer: undefined,
  projects: config.projects?.map((project) =>
    project.name === "chromium"
      ? {
          ...project,
          testMatch: ["**/e2e/**/*.spec.ts", "**/a11y/**/*.spec.ts", "**/workers/**/*.spec.ts"],
        }
      : project,
  ),
});
