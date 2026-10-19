import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(
  readFileSync(new URL("./vendor/claudekit/manifest.json", import.meta.url)),
);
export const digest = (value) => createHash("sha256").update(value).digest("hex");

export function launcher(projectRoot, entry) {
  const directory = join(projectRoot, "apps/web/.cursor/skills", entry.skill, "scripts");
  const target = join(projectRoot, "scripts/vendor/claudekit", entry.skill, `${entry.name}.mjs`);
  const modulePath = relative(directory, target).split(sep).join("/");
  return `#!/usr/bin/env node\n// Project-maintained CLI compatibility launcher; original retained as .upstream.\nvoid import(${JSON.stringify(modulePath)})\n  .then(({ main }) => main())\n  .catch(() => {\n    console.error("ClaudeKit CLI failed; inspect the project ESM adaptation.");\n    process.exitCode = 1;\n  });\n`;
}

// Explicit opt-in only. Never install global skills, create missing packages,
// overwrite unknown versions, follow a global symlink, or discard local edits.
export function install(projectRoot, { apply = false, entries = manifest } = {}) {
  const pending = [];
  let installed = 0;
  for (const entry of entries) {
    if (!["brand", "design-system"].includes(entry.skill) || !/^[a-z-]+$/.test(entry.name))
      throw new Error("Invalid project skill manifest.");
    const file = join(
      projectRoot,
      "apps/web/.cursor/skills",
      entry.skill,
      "scripts",
      `${entry.name}.cjs`,
    );
    if (!existsSync(file)) continue;
    const allowedRoot = realpathSync(projectRoot) + sep;
    if (lstatSync(file).isSymbolicLink() || !realpathSync(file).startsWith(allowedRoot))
      throw new Error("Refusing a skill outside this project.");
    const source = readFileSync(file, "utf8");
    if (source === launcher(projectRoot, entry)) {
      installed++;
      continue;
    }
    if (digest(source) !== entry.upstreamSha256)
      throw new Error("Unknown or modified skill version; review before adapting.");
    if (
      existsSync(file + ".upstream") &&
      digest(readFileSync(file + ".upstream")) !== entry.upstreamSha256
    )
      throw new Error("Original skill backup differs; refusing overwrite.");
    pending.push({ file, source, entry });
  }
  if (!apply && pending.length) throw new Error("Reviewed project skills need explicit --apply.");
  // Validate every target before the first write.
  for (const { file, source, entry } of pending) {
    if (!existsSync(file + ".upstream"))
      writeFileSync(file + ".upstream", source, { flag: "wx", mode: 0o600 });
    writeFileSync(file, launcher(projectRoot, entry));
  }
  return { installed: installed + pending.length, adapted: pending.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    console.log(JSON.stringify(install(root, { apply: process.argv.includes("--apply") })));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
