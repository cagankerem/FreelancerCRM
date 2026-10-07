import { expect, test } from "@playwright/test";

test("unknown routes return an accessible recovery page", async ({ page }) => {
  const response = await page.goto("/__test__/unknown-route");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Sayfa bulunamadı" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ana sayfaya dön" })).toHaveAttribute("href", "/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
});
