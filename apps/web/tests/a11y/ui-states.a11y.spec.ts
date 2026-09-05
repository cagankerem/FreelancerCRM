import { expect, test } from "@playwright/test";

import {
  expectNoAxeViolations,
  gotoWithTheme,
  themes,
} from "../helpers/accessibility";

for (const theme of themes) {
  test(`disabled, validation, loading, and destructive UI states are axe-clean in ${theme} theme`, async ({
    page,
  }) => {
    await gotoWithTheme(page, theme, "/test-fixtures/ui-states");

    await expect(
      page.getByRole("button", { name: "Devre dışı işlem" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("status").filter({ hasText: "Test içeriği yükleniyor" }),
    ).toHaveAttribute("aria-busy", "true");
    await expect(
      page.getByRole("alert").filter({ hasText: "İçerik yüklenemedi" }),
    ).not.toContainText(/error|exception|secret/i);

    await expectNoAxeViolations(page, "main");
  });
}
