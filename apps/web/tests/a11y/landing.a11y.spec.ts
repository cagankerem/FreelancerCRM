import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, gotoWithTheme, themes } from "../helpers/accessibility";

for (const theme of themes) {
  test(`landing form is usable and has no detectable WCAG A or AA violations in its normal ${theme} state`, async ({
    page,
  }) => {
    await gotoWithTheme(page, theme);

    const form = page.getByRole("form", { name: "Alpha sürümüne katıl" });
    await expect(form).toBeVisible();
    await expect(form.getByRole("textbox", { name: /e-posta adresin/i })).toBeEnabled();
    await expect(form.getByRole("combobox", { name: /sen kimsin/i })).toBeEnabled();
    await expect(form.getByRole("checkbox", { name: /ürün duyurularını/i })).toBeEnabled();
    await expect(form.getByRole("button", { name: "Alpha sürümüne katıl" })).toBeEnabled();

    await expectNoAxeViolations(page);
  });
}
