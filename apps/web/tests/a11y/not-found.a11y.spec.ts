import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("not-found page has no automatically detectable WCAG A or AA violations", async ({
  page,
}) => {
  const response = await page.goto("/__test__/missing-page");
  expect(response?.status()).toBe(404);

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
