import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const colorScheme of ["light", "dark"] as const) {
  test(`landing page has no automatically detectable WCAG A or AA violations in ${colorScheme} theme`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const violations = results.violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      targets: nodes.map((node) => node.target.join(" ")),
    }));

    expect(violations).toEqual([]);
  });
}
