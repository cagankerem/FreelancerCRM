import { expect, test } from "@playwright/test";

test("resolves the dark semantic token set from the system preference", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveClass(/dark/);

  const tokens = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      background: styles.getPropertyValue("--background").trim(),
      foreground: styles.getPropertyValue("--foreground").trim(),
      ring: styles.getPropertyValue("--ring").trim(),
      colorScheme: styles.colorScheme,
    };
  });

  expect(tokens).toEqual({
    background: "#0b1020",
    foreground: "#f8fafc",
    ring: "#2563eb",
    colorScheme: "dark",
  });
});

test("persists an explicit light preference over a dark system preference", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => {
    window.localStorage.setItem("kapsam-theme", "light");
  });
  await page.goto("/");

  await expect(page.locator("html")).toHaveClass(/light/);
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  const colorScheme = await page.evaluate(
    () => getComputedStyle(document.documentElement).colorScheme,
  );
  expect(colorScheme).toBe("light");
});
