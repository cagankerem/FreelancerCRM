import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const appDirectory = new URL("../", import.meta.url);

const [layoutSource, landingStyles] = await Promise.all([
  readFile(new URL("app/layout.tsx", appDirectory), "utf8"),
  readFile(
    new URL("components/marketing/landing-page.css", appDirectory),
    "utf8",
  ),
]);

test("Manrope and Sora use their variable weight axes", () => {
  assert.equal(
    layoutSource.match(/weight:\s*"variable"/g)?.length,
    2,
    "Both downloaded font families must use variable weights.",
  );
  assert.doesNotMatch(
    layoutSource,
    /weight:\s*\[/,
    "A partial static-weight list would make intermediate design weights non-deterministic.",
  );
});

test("landing weights remain inside the downloaded variable-font ranges", () => {
  const weights = [...landingStyles.matchAll(/font-weight:\s*(\d+)/g)].map(
    ([, weight]) => Number(weight),
  );

  assert.ok(weights.length > 0, "Expected explicit landing font weights.");
  for (const weight of weights) {
    assert.ok(
      weight >= 200 && weight <= 800,
      `Landing font weight ${weight} is outside the Manrope 200–800 axis.`,
    );
  }
});
