import { expect, test } from "@playwright/test";

test.use({
  contextOptions: { reducedMotion: "reduce" },
});

test("landing honors the reduced-motion preference", async ({ page }) => {
  await page.goto("/");

  const motion = await page.locator(".lp-nav__cta").evaluate((element) => {
    const style = window.getComputedStyle(element);
    const toMilliseconds = (value: string) =>
      value.endsWith("ms") ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;

    return {
      preferenceMatches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      scrollBehavior: window.getComputedStyle(document.documentElement).scrollBehavior,
      transitionDurations: style.transitionDuration
        .split(",")
        .map((duration) => toMilliseconds(duration.trim())),
    };
  });

  expect(motion.preferenceMatches).toBe(true);
  expect(motion.scrollBehavior).toBe("auto");
  expect(motion.transitionDurations.every((duration) => duration <= 0.01)).toBe(true);
});
