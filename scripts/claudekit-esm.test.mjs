import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { digest, install, launcher } from "./install-claudekit-esm.mjs";

const root = resolve(import.meta.dirname, "..");
const vendor = join(root, "scripts/vendor/claudekit");
const manifest = JSON.parse(readFileSync(join(vendor, "manifest.json")));
function temporary(run) {
  const directory = mkdtempSync(join(tmpdir(), "freelancercrm-skill-test-"));
  try {
    return run(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
function cli(skill, name, args, cwd) {
  return spawnSync(process.execPath, [join(vendor, skill, name + ".mjs"), ...args], {
    cwd,
    encoding: "utf8",
  });
}

test("all seven tracked ESM modules import without executing their CLI", async () => {
  for (const entry of manifest) {
    const imported = await import(`./vendor/claudekit/${entry.skill}/${entry.name}.mjs`);
    assert.equal(typeof imported.main, "function");
  }
});
test("clean checkout without optional local skills needs no mutation", () =>
  temporary((directory) => {
    assert.deepEqual(install(directory), { installed: 0, adapted: 0 });
    assert.equal(existsSync(join(directory, "apps")), false);
  }));
test("installer is opt-in, hash-pinned, preserves originals and is idempotent", () =>
  temporary((directory) => {
    const original = "// reviewed local CLI fixture\n";
    const entry = { skill: "brand", name: "extract-colors", upstreamSha256: digest(original) };
    const file = join(directory, "apps/web/.cursor/skills/brand/scripts/extract-colors.cjs");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, original);
    assert.throws(() => install(directory, { entries: [entry] }), /explicit/);
    assert.equal(readFileSync(file, "utf8"), original);
    assert.deepEqual(install(directory, { apply: true, entries: [entry] }), {
      installed: 1,
      adapted: 1,
    });
    assert.equal(readFileSync(file + ".upstream", "utf8"), original);
    assert.equal(readFileSync(file, "utf8"), launcher(directory, entry));
    assert.deepEqual(install(directory, { apply: true, entries: [entry] }), {
      installed: 1,
      adapted: 0,
    });
    writeFileSync(file, "// user modification\n");
    assert.throws(() => install(directory, { apply: true, entries: [entry] }), /modified/);
    assert.equal(readFileSync(file, "utf8"), "// user modification\n");
  }));
test("installer refuses symlinked global skills and invalid manifest paths", () =>
  temporary((directory) => {
    const target = join(directory, "source.cjs");
    writeFileSync(target, "// fixture");
    const file = join(directory, "apps/web/.cursor/skills/brand/scripts/extract-colors.cjs");
    mkdirSync(dirname(file), { recursive: true });
    symlinkSync(target, file);
    assert.throws(() => install(directory, { apply: true }), /outside/);
    assert.throws(
      () => install(directory, { entries: [{ skill: "../outside", name: "bad" }] }),
      /manifest/,
    );
  }));
test("token generator and embedder retain CLI output; no project asset is modified", () =>
  temporary((directory) => {
    mkdirSync(join(directory, "assets"));
    writeFileSync(
      join(directory, "tokens.json"),
      JSON.stringify({
        primitive: { color: { blue: { $value: "#123456" } } },
        semantic: { color: { primary: { $value: "{primitive.color.blue}" } } },
      }),
    );
    const result = cli(
      "design-system",
      "generate-tokens",
      ["--config", "tokens.json", "-o", "assets/design-tokens.css"],
      directory,
    );
    assert.equal(result.status, 0, result.stderr);
    const css = readFileSync(join(directory, "assets/design-tokens.css"), "utf8");
    assert.match(css, /--color-primary: #123456;/);
    const embedded = cli("design-system", "embed-tokens", ["--minimal", "--style"], directory);
    assert.equal(embedded.status, 0, embedded.stderr);
    assert.match(embedded.stdout, /<style>/);
    assert.match(embedded.stdout, /--color-primary: #123456;/);
  }));
test("token validator still rejects hardcoded CSS even beside var references", () =>
  temporary((directory) => {
    writeFileSync(
      join(directory, "sample.css"),
      ".btn { background: #FF6B6B; color: var(--color-primary); }\n",
    );
    const invalid = cli("design-system", "validate-tokens", ["--dir", directory], directory);
    assert.equal(invalid.status, 1);
    assert.match(invalid.stdout, /#FF6B6B/);
    writeFileSync(join(directory, "sample.css"), ".btn { color: var(--color-primary); }\n");
    const valid = cli("design-system", "validate-tokens", ["--dir", directory], directory);
    assert.equal(valid.status, 0);
    assert.match(valid.stdout, /No token violations/);
  }));
test("brand sync retains dry-run and write behavior in an isolated workspace", () =>
  temporary((directory) => {
    mkdirSync(join(directory, "docs"));
    mkdirSync(join(directory, "assets"));
    writeFileSync(
      join(directory, "docs/brand-guidelines.md"),
      "# Brand\n| Primary Color | #2563EB |\n| Secondary Color | #8B5CF6 |\n| Accent Color | #10B981 |\n",
    );
    const dry = cli("brand", "sync-brand-to-tokens", ["--dry-run"], directory);
    assert.equal(dry.status, 0, dry.stderr);
    assert.equal(existsSync(join(directory, "assets/design-tokens.json")), false);
    const written = cli("brand", "sync-brand-to-tokens", [], directory);
    assert.equal(written.status, 0, written.stderr);
    const tokens = JSON.parse(readFileSync(join(directory, "assets/design-tokens.json")));
    assert.equal(tokens.primitive.color.primary["500"].$value, "#2563EB");
    assert.equal(tokens.primitive.color.secondary["500"].$value, "#8B5CF6");
    assert.equal(tokens.primitive.color.accent["500"].$value, "#10B981");
  }));

test("installed CommonJS CLI launcher invokes the tracked ESM command", () =>
  temporary((directory) => {
    const original = "// reviewed CLI fixture\n";
    const entry = {
      skill: "design-system",
      name: "generate-tokens",
      upstreamSha256: digest(original),
    };
    const file = join(
      directory,
      "apps/web/.cursor/skills/design-system/scripts/generate-tokens.cjs",
    );
    mkdirSync(dirname(file), { recursive: true });
    mkdirSync(join(directory, "scripts/vendor"), { recursive: true });
    symlinkSync(vendor, join(directory, "scripts/vendor/claudekit"), "dir");
    writeFileSync(file, original);
    install(directory, { apply: true, entries: [entry] });
    const result = spawnSync(process.execPath, [file, "--help"], {
      cwd: directory,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Usage: node generate-tokens/);
  }));

test("brand CLIs preserve JSON palette/context and missing-asset rejection", async () => {
  temporary((directory) => {
    mkdirSync(join(directory, "docs"));
    writeFileSync(
      join(directory, "docs/brand-guidelines.md"),
      "# Brand\n## Colors\n### Primary\n#123456\n",
    );
    const palette = cli("brand", "extract-colors", ["--palette", "--json"], directory);
    assert.equal(palette.status, 0, palette.stderr);
    assert.deepEqual(JSON.parse(palette.stdout).primary, ["#123456"]);
    const context = cli("brand", "inject-brand-context", ["--json"], directory);
    assert.equal(context.status, 0, context.stderr);
    assert.equal(typeof JSON.parse(context.stdout).colors, "object");
    const missing = cli("brand", "validate-asset", [], directory);
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /Usage:/);
  });
  const { hexToRgb } = await import("./vendor/claudekit/brand/extract-colors.mjs");
  assert.deepEqual(hexToRgb("#123456"), { r: 18, g: 52, b: 86 });
});
