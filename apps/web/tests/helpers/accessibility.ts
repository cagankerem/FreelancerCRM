import AxeBuilder from "@axe-core/playwright"
import { expect, type Page } from "@playwright/test"

const themes = ["light", "dark"] as const

type Theme = (typeof themes)[number]

async function gotoWithTheme(page: Page, theme: Theme, path = "/") {
  await page.emulateMedia({ colorScheme: theme })
  await page.addInitScript((storedTheme) => {
    window.localStorage.clear()
    window.localStorage.setItem("kapsam-theme", storedTheme)
  }, theme)

  const response = await page.goto(path)

  await expect(page.locator("html")).toHaveClass(
    new RegExp(`(^|\\s)${theme}(\\s|$)`),
  )

  if ((await page.locator(".lp-page").count()) > 0) {
    await expect(page.locator(".lp-price strong")).not.toHaveAttribute(
      "aria-label",
      "Fiyat yükleniyor",
    )
  }

  return response
}

async function expectNoAxeViolations(page: Page, include?: string) {
  let builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
  ])

  if (include) {
    builder = builder.include(include)
  }

  const results = await builder.analyze()
  const violations = results.violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    targets: nodes.map((node) => node.target.join(" ")),
  }))

  expect(violations).toEqual([])
}

export { expectNoAxeViolations, gotoWithTheme, themes }
export type { Theme }
