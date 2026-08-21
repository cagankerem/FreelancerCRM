import { expect, test } from "@playwright/test";

test("landing page exposes its primary content and navigation", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Hızlı teklif bağlantısı, tüm tekliflerini tek pencerede görüntüleme.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("navigation", { name: "Ana navigasyon" }),
  ).toBeVisible();
});
