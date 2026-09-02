import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { width: 320, height: 800 },
  { width: 375, height: 812 },
  { width: 768, height: 900 },
  { width: 1440, height: 1000 },
] as const;

for (const viewport of VIEWPORTS) {
  test(`landing does not overflow horizontally at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const documentWidths = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));

    expect(documentWidths.body).toBeLessThanOrEqual(documentWidths.viewport);
    expect(documentWidths.document).toBeLessThanOrEqual(documentWidths.viewport);

    if (viewport.width <= 375) {
      const fields = await page.locator(".lp-form-row > .lp-field").evaluateAll(
        (elements) =>
          elements.map((element) => {
            const bounds = element.getBoundingClientRect();
            return {
              bottom: bounds.bottom,
              left: bounds.left,
              top: bounds.top,
              width: bounds.width,
            };
          }),
      );

      expect(fields).toHaveLength(2);
      expect(Math.abs(fields[0].left - fields[1].left)).toBeLessThanOrEqual(1);
      expect(Math.abs(fields[0].width - fields[1].width)).toBeLessThanOrEqual(1);
      expect(fields[1].top).toBeGreaterThanOrEqual(fields[0].bottom);
    }
  });
}

test("mobile waitlist anchor clears the sticky navigation", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page.locator(".lp-nav__cta").click();

  await expect(page).toHaveURL(/#waitlist$/);
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const navigation = document.querySelector(".lp-nav");
        const waitlist = document.querySelector("#waitlist");
        if (!navigation || !waitlist) {
          return Number.NEGATIVE_INFINITY;
        }

        return (
          waitlist.getBoundingClientRect().top -
          navigation.getBoundingClientRect().bottom
        );
      }),
    )
    .toBeGreaterThanOrEqual(0);
});
