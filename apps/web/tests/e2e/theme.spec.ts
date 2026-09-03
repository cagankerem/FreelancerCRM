import { expect, test } from "@playwright/test";

const landingThemes = {
  light: {
    canvas: "#f6f8fc",
    canvasRgb: "rgb(246, 248, 252)",
    surface: "#fff",
    surfaceRgb: "rgb(255, 255, 255)",
    onSurface: "#101828",
    onSurfaceRgb: "rgb(16, 24, 40)",
  },
  dark: {
    canvas: "#0b1020",
    canvasRgb: "rgb(11, 16, 32)",
    surface: "#111827",
    surfaceRgb: "rgb(17, 24, 39)",
    onSurface: "#f8fafc",
    onSurfaceRgb: "rgb(248, 250, 252)",
  },
} as const;

test("resolves the dark semantic token set from the system preference", async ({
  page,
}) => {
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

for (const colorScheme of ["light", "dark"] as const) {
  test(`renders real landing surfaces in ${colorScheme} theme`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");

    await expect(page.locator("html")).toHaveClass(
      new RegExp(`(^|\\s)${colorScheme}(\\s|$)`),
    );

    const landingTheme = await page.locator(".lp-page").evaluate((element) => {
      const styles = getComputedStyle(element);
      const conversionPanel = getComputedStyle(
        document.querySelector(".lp-conversion-panel")!,
      );
      const footer = getComputedStyle(document.querySelector(".lp-footer")!);

      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        lpCanvas: styles.getPropertyValue("--lp-canvas").trim().toLowerCase(),
        lpSurface: styles
          .getPropertyValue("--lp-surface")
          .trim()
          .toLowerCase(),
        lpInk: styles.getPropertyValue("--lp-ink").trim().toLowerCase(),
        primary: styles.getPropertyValue("--primary").trim().toLowerCase(),
        conversionSurface: conversionPanel.backgroundColor,
        footerSurface: footer.backgroundColor,
      };
    });

    const expected = landingThemes[colorScheme];
    expect(landingTheme).toEqual({
      backgroundColor: expected.canvasRgb,
      color: expected.onSurfaceRgb,
      lpCanvas: expected.canvas,
      lpSurface: expected.surface,
      lpInk: expected.onSurface,
      primary: colorScheme === "light" ? "#6d28d9" : "#7c3aed",
      conversionSurface: expected.surfaceRgb,
      footerSurface: expected.surfaceRgb,
    });
  });

  test(`keeps the landing focus color canonical in ${colorScheme} theme`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");

    const email = page.getByRole("textbox", { name: /e-posta adresin/i });
    await email.focus();

    await expect
      .poll(() =>
        email.evaluate((element) => getComputedStyle(element).outlineColor),
      )
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
