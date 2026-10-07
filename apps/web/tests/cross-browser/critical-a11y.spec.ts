import { test } from "@playwright/test";

import { expectNoAxeViolations, gotoWithTheme, themes } from "../helpers/accessibility";

for (const theme of themes) {
  test(`critical landing has no detectable WCAG A or AA violations in ${theme} theme`, async ({
    page,
  }) => {
    await gotoWithTheme(page, theme);
    await expectNoAxeViolations(page);
  });
}
