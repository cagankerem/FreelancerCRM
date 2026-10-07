import { expect, test } from "@playwright/test";

import { gotoWithTheme, themes } from "../helpers/accessibility";

test("resolves the dark semantic token set from the system preference", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveClass(/dark/);

  const tokens = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      canvas: styles.getPropertyValue("--canvas").trim().toLowerCase(),
      background: styles.getPropertyValue("--background").trim().toLowerCase(),
      surface: styles.getPropertyValue("--surface").trim().toLowerCase(),
      card: styles.getPropertyValue("--card").trim().toLowerCase(),
      onSurface: styles.getPropertyValue("--on-surface").trim().toLowerCase(),
      foreground: styles.getPropertyValue("--foreground").trim().toLowerCase(),
      focus: styles.getPropertyValue("--focus").trim().toLowerCase(),
      ring: styles.getPropertyValue("--ring").trim().toLowerCase(),
      colorScheme: styles.colorScheme,
    };
  });

  expect(tokens).toEqual({
    canvas: "#0b1020",
    background: "#0b1020",
    surface: "#111827",
    card: "#111827",
    onSurface: "#f8fafc",
    foreground: "#f8fafc",
    focus: "#2563eb",
    ring: "#2563eb",
    colorScheme: "dark",
  });
});

for (const theme of themes) {
  test(`renders real landing surfaces in ${theme} theme`, async ({ page }) => {
    await gotoWithTheme(page, theme);

    const landingTheme = await page.locator(".lp-page").evaluate((element) => {
      const root = getComputedStyle(document.documentElement);
      const styles = getComputedStyle(element);
      const conversionPanel = getComputedStyle(document.querySelector(".lp-conversion-panel")!);
      const footer = getComputedStyle(document.querySelector(".lp-footer")!);
      const resolveColor = (variable: string) => {
        const probe = document.createElement("span");
        probe.style.color = `var(${variable})`;
        element.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      };

      return {
        backgroundColor: styles.backgroundColor,
        canvasColor: resolveColor("--canvas"),
        color: styles.color,
        onSurfaceColor: resolveColor("--on-surface"),
        rootCanvas: root.getPropertyValue("--canvas").trim().toLowerCase(),
        rootSurface: root.getPropertyValue("--surface").trim().toLowerCase(),
        rootOnSurface: root.getPropertyValue("--on-surface").trim().toLowerCase(),
        rootPrimary: root.getPropertyValue("--primary").trim().toLowerCase(),
        lpCanvas: styles.getPropertyValue("--lp-canvas").trim().toLowerCase(),
        lpSurface: styles.getPropertyValue("--lp-surface").trim().toLowerCase(),
        lpInk: styles.getPropertyValue("--lp-ink").trim().toLowerCase(),
        primary: styles.getPropertyValue("--primary").trim().toLowerCase(),
        conversionSurface: conversionPanel.backgroundColor,
        footerSurface: footer.backgroundColor,
        surfaceColor: resolveColor("--surface"),
      };
    });

    expect(landingTheme.lpCanvas).toBe(landingTheme.rootCanvas);
    expect(landingTheme.lpSurface).toBe(landingTheme.rootSurface);
    expect(landingTheme.lpInk).toBe(landingTheme.rootOnSurface);
    expect(landingTheme.primary).toBe(landingTheme.rootPrimary);
    expect(landingTheme.backgroundColor).toBe(landingTheme.canvasColor);
    expect(landingTheme.color).toBe(landingTheme.onSurfaceColor);
    expect(landingTheme.conversionSurface).toBe(landingTheme.surfaceColor);
    expect(landingTheme.footerSurface).toBe(landingTheme.surfaceColor);
  });

  test(`keeps the landing focus color canonical in ${theme} theme`, async ({ page }) => {
    await gotoWithTheme(page, theme);

    const email = page.getByRole("textbox", { name: /e-posta adresin/i });
    await email.focus();

    await expect
      .poll(() => email.evaluate((element) => getComputedStyle(element).outlineColor))
      .toBe("rgb(37, 99, 235)");

    const focusStyles = await email.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        focus: styles.getPropertyValue("--focus").trim().toLowerCase(),
        ring: styles.getPropertyValue("--ring").trim().toLowerCase(),
        outlineStyle: styles.outlineStyle,
        outlineWidth: styles.outlineWidth,
      };
    });

    expect(focusStyles).toEqual({
      focus: "#2563eb",
      ring: "#2563eb",
      outlineStyle: "solid",
      outlineWidth: "3px",
    });
  });
}

test("persists an explicit light preference over a dark system preference", async ({ page }) => {
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
