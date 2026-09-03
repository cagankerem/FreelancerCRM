import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = dirname(testDirectory);
const projectDirectory = dirname(dirname(appDirectory));

const [designDocument, globalStyles, landingStyles] = await Promise.all([
  readFile(join(projectDirectory, "DESIGN.md"), "utf8"),
  readFile(join(appDirectory, "app", "globals.css"), "utf8"),
  readFile(
    join(appDirectory, "components", "marketing", "landing-page.css"),
    "utf8",
  ),
]);

const canonicalColors = parseDesignColors(designDocument);
const lightTokens = parseCustomProperties(extractBlock(globalStyles, ":root"));
const darkTokens = parseCustomProperties(extractBlock(globalStyles, ".dark"));
const themeExports = parseCustomProperties(
  extractBlock(globalStyles, "@theme inline"),
);

const shadcnAliases = {
  background: "canvas",
  foreground: "on-surface",
  card: "surface",
  "card-foreground": "on-surface",
  popover: "surface",
  "popover-foreground": "on-surface",
  muted: "surface-subtle",
  "muted-foreground": "on-surface-muted",
  border: "outline",
  input: "control-outline",
  ring: "focus",
  "primary-foreground": "on-primary",
  "secondary-foreground": "on-secondary",
  "tertiary-foreground": "on-tertiary",
  destructive: "danger",
  "destructive-foreground": "on-danger",
  "action-primary-foreground": "on-action-primary",
  "status-attention-foreground": "on-status-attention-container",
  "danger-action-foreground": "on-danger",
  "sidebar-foreground": "sidebar-text",
  "sidebar-primary": "primary",
  "sidebar-primary-foreground": "on-primary",
  "sidebar-accent": "sidebar-raised",
  "sidebar-ring": "focus",
};

const landingAliases = {
  "lp-ink": "on-surface",
  "lp-ink-soft": "on-surface-soft",
  "lp-muted": "on-surface-muted",
  "lp-canvas": "canvas",
  "lp-surface": "surface",
  "lp-purple": "primary",
  "lp-purple-dark": "primary-hover",
  "lp-blue": "secondary",
  "lp-cyan": "tertiary",
  "lp-orange": "action-primary",
  "lp-orange-dark": "action-primary-hover",
  "lp-line": "outline",
  "lp-line-soft": "outline-soft",
  background: "surface",
  foreground: "on-surface",
  "primary-foreground": "on-action-primary",
  "muted-foreground": "on-surface-muted",
  border: "outline",
  input: "control-outline",
  ring: "focus",
  destructive: "danger",
};

test("globals.css implements every canonical DESIGN.md color in both themes", () => {
  assert.ok(canonicalColors.size > 0, "No DESIGN.md color tokens were parsed.");
  assert.ok(
    canonicalColors.has("on-surface-muted"),
    "The canonical muted text token must be on-surface-muted.",
  );
  assert.equal(
    canonicalColors.has("muted"),
    false,
    "DESIGN.md must not reuse shadcn's muted surface name for text.",
  );

  for (const [name, values] of canonicalColors) {
    assert.equal(
      lightTokens.get(name),
      values.light,
      `Light --${name} must match DESIGN.md.`,
    );
    assert.equal(
      darkTokens.get(name),
      values.dark,
      `Dark --${name} must match DESIGN.md.`,
    );
  }
});

test("shadcn compatibility tokens alias canonical colors without duplicating values", () => {
  for (const [alias, canonical] of Object.entries(shadcnAliases)) {
    assert.equal(
      lightTokens.get(alias),
      `var(--${canonical})`,
      `--${alias} must alias --${canonical}.`,
    );
    assert.equal(
      darkTokens.has(alias),
      false,
      `Dark mode must inherit the dynamic --${alias} alias.`,
    );
  }
});

test("@theme inline exports every canonical color and preserves shadcn exports", () => {
  for (const name of canonicalColors.keys()) {
    assert.equal(
      themeExports.get(`color-${name}`),
      `var(--${name})`,
      `Tailwind must export --${name}.`,
    );
  }

  for (const alias of Object.keys(shadcnAliases)) {
    assert.equal(
      themeExports.get(`color-${alias}`),
      `var(--${alias})`,
      `Tailwind must preserve the --${alias} compatibility export.`,
    );
  }
});

test("landing compatibility colors resolve through canonical semantic tokens", () => {
  const landingTokens = parseCustomProperties(
    extractBlock(landingStyles, ".lp-page"),
  );

  for (const [alias, canonical] of Object.entries(landingAliases)) {
    assert.equal(
      landingTokens.get(alias),
      `var(--${canonical})`,
      `Landing --${alias} must alias --${canonical}.`,
    );
  }

  assert.equal(
    landingTokens.has("primary"),
    false,
    "Landing must inherit canonical --primary so --lp-purple cannot form an alias cycle.",
  );
});

test("landing contains no theme-dependent raw color literals", () => {
  const rawColors = [
    ...landingStyles.matchAll(/#[0-9a-f]{3,8}\b|rgba?\(/gi),
  ].map((match) => match[0]);

  assert.deepEqual(
    rawColors,
    [],
    "Landing colors must derive from canonical semantic tokens.",
  );
});

test("focus and ring remain bound to the canonical focus color in every CSS scope", () => {
  assert.match(
    globalStyles,
    /:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--focus\);/s,
  );

  for (const [file, styles] of [
    ["app/globals.css", globalStyles],
    ["components/marketing/landing-page.css", landingStyles],
  ]) {
    const ringValues = [...styles.matchAll(/--ring:\s*([^;]+);/g)].map(
      (match) => match[1].trim(),
    );

    assert.ok(ringValues.length > 0, `${file} must declare a ring token.`);
    assert.deepEqual(
      [...new Set(ringValues)],
      ["var(--focus)"],
      `${file} must not override the canonical focus color.`,
    );
  }
});

function parseDesignColors(markdown) {
  const colorsSection = markdown.match(/^colors:\n([\s\S]*?)^typography:/m);
  assert.ok(colorsSection, "DESIGN.md colors section was not found.");

  const colors = new Map();
  const tokenPattern =
    /^  ([a-z0-9-]+):\n    light: "([^"]+)"\n    dark: "([^"]+)"/gm;

  for (const match of colorsSection[1].matchAll(tokenPattern)) {
    colors.set(match[1], { light: match[2], dark: match[3] });
  }

  return colors;
}

function extractBlock(styles, selector) {
  const selectorIndex = styles.indexOf(`${selector} {`);
  assert.notEqual(selectorIndex, -1, `${selector} block was not found.`);

  const openingBrace = styles.indexOf("{", selectorIndex);
  let depth = 0;

  for (let index = openingBrace; index < styles.length; index += 1) {
    if (styles[index] === "{") depth += 1;
    if (styles[index] === "}") depth -= 1;
    if (depth === 0) return styles.slice(openingBrace + 1, index);
  }

  assert.fail(`${selector} block is not closed.`);
}

function parseCustomProperties(block) {
  return new Map(
    [...block.matchAll(/^\s*--([a-z0-9-]+):\s*([^;]+);/gm)].map(
      (match) => [match[1], match[2].trim()],
    ),
  );
}
