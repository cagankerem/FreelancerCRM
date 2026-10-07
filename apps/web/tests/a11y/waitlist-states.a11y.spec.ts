import { expect, test, type Page } from "@playwright/test";

import { WAITLIST_STORAGE_KEY } from "../../lib/client/waitlist-storage";
import { expectNoAxeViolations, gotoWithTheme, themes } from "../helpers/accessibility";

const formName = "Alpha sürümüne katıl";

async function submitWithKeyboard(page: Page) {
  const form = page.getByRole("form", { name: formName });
  const email = form.getByRole("textbox", { name: /e-posta adresin/i });
  const persona = form.getByRole("combobox", { name: /sen kimsin/i });
  const consent = form.getByRole("checkbox", { name: /ürün duyurularını/i });
  const submit = form.getByRole("button", { name: formName });

  await email.focus();
  await page.keyboard.type("user@example.com");
  await page.keyboard.press("Tab");
  await expect(persona).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(consent).toBeFocused();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");

  return form;
}

for (const theme of themes) {
  test(`waitlist validation state is announced and axe-clean in ${theme} theme`, async ({
    page,
  }) => {
    await gotoWithTheme(page, theme);

    const form = page.getByRole("form", { name: formName });
    const submit = form.getByRole("button", { name: formName });
    await submit.focus();
    await page.keyboard.press("Enter");

    const email = form.getByRole("textbox", { name: /e-posta adresin/i });
    const error = form.getByRole("alert");
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(error).toHaveText("E-posta adresini gir.");

    const errorId = await error.getAttribute("id");
    expect(errorId).toBeTruthy();
    if (errorId === null) {
      throw new Error("Validation alert must expose a stable id.");
    }
    await expect(email).toHaveAttribute("aria-describedby", errorId);
    await expect(error.locator("[role], [aria-live]")).toHaveCount(0);

    await expectNoAxeViolations(page, "#waitlist");
  });

  test(`waitlist selected state is semantic and axe-clean in ${theme} theme`, async ({ page }) => {
    await gotoWithTheme(page, theme);

    const form = page.getByRole("form", { name: formName });
    const persona = form.getByRole("combobox", { name: /sen kimsin/i });
    const consent = form.getByRole("checkbox", { name: /ürün duyurularını/i });
    await persona.selectOption("designer");
    await consent.click();

    await expect(persona).toHaveValue("designer");
    await expect(consent).toHaveAttribute("aria-checked", "true");
    await expect(consent.locator('[data-slot="checkbox-indicator"]')).toBeVisible();

    await expectNoAxeViolations(page, "#waitlist");
  });

  test(`waitlist success state uses one polite live region and is axe-clean in ${theme} theme`, async ({
    page,
  }) => {
    await gotoWithTheme(page, theme);
    const form = await submitWithKeyboard(page);

    const status = form.getByRole("status");
    await expect(status).toContainText(/demo kaydın bu cihazda saklandı/i);
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(status.locator('[role="status"], [role="alert"], [aria-live]')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), WAITLIST_STORAGE_KEY))
      .not.toBeNull();

    await expectNoAxeViolations(page, "#waitlist");
  });

  test(`waitlist storage failure uses one safe alert and is axe-clean in ${theme} theme`, async ({
    page,
  }) => {
    await page.addInitScript((waitlistKey) => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItem(key, value) {
        if (key === waitlistKey) {
          throw new DOMException("SECRET quota implementation detail", "QuotaExceededError");
        }
        originalSetItem.call(this, key, value);
      };
    }, WAITLIST_STORAGE_KEY);
    await gotoWithTheme(page, theme);

    const form = page.getByRole("form", { name: formName });
    await form.getByRole("textbox", { name: /e-posta adresin/i }).fill("storage@example.com");
    await form.getByRole("button", { name: formName }).click();

    const alert = form.getByRole("alert");
    await expect(alert).toHaveText(
      "Kayıt bu tarayıcıda saklanamadı. Lütfen daha sonra tekrar dene.",
    );
    await expect(alert).not.toHaveAttribute("aria-live");
    await expect(alert.locator('[role="status"], [role="alert"], [aria-live]')).toHaveCount(0);
    await expect(page.getByText(/secret quota/i)).toHaveCount(0);

    await expectNoAxeViolations(page, "#waitlist");
  });
}
