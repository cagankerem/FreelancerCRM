import { expect, test } from "@playwright/test";

import {
  expectNoAxeViolations,
  gotoWithTheme,
  themes,
} from "../helpers/accessibility";

for (const theme of themes) {
  test(`not-found page has no automatically detectable WCAG A or AA violations in ${theme} theme`, async ({
    page,
  }) => {
    const response = await gotoWithTheme(
      page,
      theme,
      "/__test__/missing-page",
    );
    expect(response?.status()).toBe(404);

    await expectNoAxeViolations(page);
  });
}
