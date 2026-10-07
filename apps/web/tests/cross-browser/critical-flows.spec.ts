import { expect, test } from "@playwright/test";

import { gotoWithTheme, themes } from "../helpers/accessibility";

for (const theme of themes) {
  test(`critical landing and form flow works in ${theme} theme`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoWithTheme(page, theme);

    const themeContract = await page.locator(".lp-page").evaluate((element) => {
      const root = getComputedStyle(document.documentElement);
      const landing = getComputedStyle(element);
      return {
        canvas: root.getPropertyValue("--canvas").trim().toLowerCase(),
        surface: root.getPropertyValue("--surface").trim().toLowerCase(),
        lpCanvas: landing.getPropertyValue("--lp-canvas").trim().toLowerCase(),
        lpSurface: landing.getPropertyValue("--lp-surface").trim().toLowerCase(),
      };
    });
    expect(themeContract.lpCanvas).toBe(themeContract.canvas);
    expect(themeContract.lpSurface).toBe(themeContract.surface);
    expect(themeContract.canvas).not.toBe(themeContract.surface);

    const widths = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(widths.body).toBeLessThanOrEqual(widths.viewport);
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);

    let form = page.getByRole("form", { name: "Alpha sürümüne katıl" });
    const submit = form.getByRole("button", { name: "Alpha sürümüne katıl" });
    await submit.focus();
    await page.keyboard.press("Enter");

    const email = form.getByRole("textbox", { name: /e-posta adresin/i });
    const validationAlert = form.getByRole("alert");
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(validationAlert).toHaveText("E-posta adresini gir.");
    await expect(email).toHaveAttribute("aria-describedby", "waitlist-email-error");

    await gotoWithTheme(page, theme);
    form = page.getByRole("form", { name: "Alpha sürümüne katıl" });
    await form.getByRole("textbox", { name: /e-posta adresin/i }).fill(`${theme}@example.com`);
    await form.getByRole("combobox", { name: /sen kimsin/i }).selectOption("developer");
    await form.getByRole("checkbox", { name: /ürün duyurularını/i }).click();
    await form.getByRole("button", { name: "Alpha sürümüne katıl" }).press("Enter");

    const success = form.getByRole("status");
    await expect(success).toContainText(/demo kaydın bu cihazda saklandı/i);
    await expect(success).toHaveAttribute("aria-live", "polite");
    await expect(success.locator('[role="status"], [role="alert"], [aria-live]')).toHaveCount(0);
  });
}
