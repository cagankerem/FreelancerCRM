import { expect, test, type Locator } from "@playwright/test";

import { gotoWithTheme, themes } from "../helpers/accessibility";

async function resolvedVariableColor(locator: Locator, variable: string) {
  return locator.evaluate((element, customProperty) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${customProperty})`;
    element.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, variable);
}

async function backgroundColor(locator: Locator) {
  return locator.evaluate((element) => getComputedStyle(element).backgroundColor);
}

for (const theme of themes) {
  test(`normal, hover, active, focus, disabled, selected, validation, loading, and destructive states work in ${theme} theme`, async ({
    page,
  }) => {
    await gotoWithTheme(page, theme, "/test-fixtures/ui-states");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(page.getByRole("navigation")).toHaveCount(0);

    const primary = page.getByRole("button", { name: "Birincil işlem" });
    const normalBackground = await backgroundColor(primary);
    expect(normalBackground).toBe(
      await resolvedVariableColor(primary, "--action-primary"),
    );

    await primary.hover();
    await expect
      .poll(() => backgroundColor(primary))
      .toBe(await resolvedVariableColor(primary, "--action-primary-hover"));
    expect(await backgroundColor(primary)).not.toBe(normalBackground);

    await page.mouse.down();
    await expect
      .poll(() =>
        primary.evaluate((element) => getComputedStyle(element).translate),
      )
      .not.toBe("none");
    await page.mouse.up();

    await page.reload();
    await expect(page.locator("html")).toHaveClass(
      new RegExp(`(^|\\s)${theme}(\\s|$)`),
    );
    await page.keyboard.press("Tab");
    await expect(primary).toBeFocused();
    expect(
      await primary.evaluate((element) => element.matches(":focus-visible")),
    ).toBe(true);
    const focusStyles = await primary.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        boxShadow: styles.boxShadow,
        focus: styles.getPropertyValue("--focus").trim().toLowerCase(),
        ring: styles.getPropertyValue("--ring").trim().toLowerCase(),
      };
    });
    expect(focusStyles.ring).toBe(focusStyles.focus);
    expect(focusStyles.boxShadow).not.toBe("none");

    const disabled = page.getByRole("button", { name: "Devre dışı işlem" });
    const destructive = page.getByRole("button", { name: "Kaydı sil" });
    await expect(disabled).toBeDisabled();
    await page.keyboard.press("Tab");
    await expect(destructive).toBeFocused();

    expect(await backgroundColor(destructive)).toBe(
      await resolvedVariableColor(destructive, "--danger-action"),
    );
    expect(await backgroundColor(destructive)).not.toBe(
      await resolvedVariableColor(destructive, "--action-primary"),
    );

    const checkbox = page.getByRole("checkbox", { name: "Bildirim seçimi" });
    const unselectedBackground = await backgroundColor(checkbox);
    const selectedBackground = await resolvedVariableColor(checkbox, "--primary");
    await checkbox.click();
    await expect(checkbox).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("Bildirim seçildi", { exact: true })).toBeVisible();
    await expect(
      checkbox.locator('[data-slot="checkbox-indicator"]'),
    ).toBeVisible();
    await expect.poll(() => backgroundColor(checkbox)).toBe(selectedBackground);
    expect(selectedBackground).not.toBe(unselectedBackground);

    const invalidInput = page.getByRole("textbox", { name: "Hatalı alan" });
    const fieldError = page
      .getByRole("alert")
      .filter({ hasText: "Geçerli bir değer gir." });
    await expect(invalidInput).toHaveAttribute("aria-invalid", "true");
    await expect(invalidInput).toHaveAttribute(
      "aria-describedby",
      "fixture-invalid-error",
    );
    await expect(fieldError).toBeVisible();
    expect(
      await fieldError.evaluate((element) => getComputedStyle(element).color),
    ).toBe(await resolvedVariableColor(fieldError, "--danger"));

    const loading = page
      .getByRole("status")
      .filter({ hasText: "Test içeriği yükleniyor" });
    await expect(loading).toHaveAttribute("aria-busy", "true");
    await expect(loading).toHaveAttribute("aria-live", "polite");
    await expect(
      loading.locator('[role="status"], [role="alert"], [aria-live]'),
    ).toHaveCount(0);

    const errorState = page
      .getByRole("alert")
      .filter({ hasText: "İçerik yüklenemedi" });
    await expect(errorState).toContainText("Güvenli kullanıcı mesajı gösteriliyor.");
    await expect(errorState).not.toContainText(/error|exception|secret/i);
    await errorState.getByRole("button", { name: "Tekrar dene" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Tekrar denendi" }),
    ).toBeVisible();
  });
}
