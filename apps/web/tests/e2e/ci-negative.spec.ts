import { expect, test } from "@playwright/test";

test("temporary fixture proves browser gate rejects a missing element", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Synthetic missing heading for CI proof" }),
  ).toBeVisible({ timeout: 1000 });
});
