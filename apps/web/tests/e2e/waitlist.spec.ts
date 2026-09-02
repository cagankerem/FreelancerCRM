import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("kapsam-alpha-waitlist-v1");
  });
  await page.goto("/");
});

test("focuses and describes the first invalid waitlist field", async ({ page }) => {
  const form = page.getByRole("form", { name: "Alpha sürümüne katıl" });
  await form.getByRole("button", { name: "Alpha sürümüne katıl" }).click();

  const email = form.getByRole("textbox", { name: /e-posta adresin/i });
  const error = form.getByRole("alert");

  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(error).toHaveText("E-posta adresini gir.");
  await expect(email).toHaveAttribute("aria-describedby", "waitlist-email-error");
});

test("submits every waitlist field with the keyboard", async ({ page }) => {
  const form = page.getByRole("form", { name: "Alpha sürümüne katıl" });
  const email = form.getByRole("textbox", { name: /e-posta adresin/i });
  const persona = form.getByRole("combobox", { name: /sen kimsin/i });
  const consent = form.getByRole("checkbox", {
    name: /ürün duyurularını da almak istiyorum/i,
  });
  const submit = form.getByRole("button", { name: "Alpha sürümüne katıl" });

  await email.focus();
  await expect(email).toBeFocused();
  expect(
    await email.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        isFocusVisible: element.matches(":focus-visible"),
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    }),
  ).toMatchObject({
    isFocusVisible: true,
    outlineStyle: "solid",
    outlineWidth: 3,
  });
  await page.keyboard.type("USER@Example.COM");
  await page.keyboard.press("Tab");
  await expect(persona).toBeFocused();
  await page.keyboard.press("f");
  await page.keyboard.press("Tab");
  await expect(consent).toBeFocused();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");

  const feedback = form.locator(".lp-form-message");
  await expect(feedback).toHaveAttribute("aria-live", "polite");
  await expect(feedback.getByText(/demo kaydın bu cihazda saklandı/i)).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem("kapsam-alpha-waitlist-v1") ?? "null"),
    ),
  ).toEqual([
    {
      email: "user@example.com",
      persona: "developer",
      marketingConsent: true,
    },
  ]);
});
