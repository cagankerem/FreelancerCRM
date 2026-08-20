import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const appDirectory = fileURLToPath(new URL("..", import.meta.url));
const projectDirectory = fileURLToPath(new URL("../../..", import.meta.url));
const lockfileNames = new Set([
  "bun.lock",
  "bun.lockb",
  "npm-shrinkwrap.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
]);
const ignoredDirectories = new Set([".git", ".next", "node_modules"]);
const sourceExtensions = new Set([".ts", ".tsx"]);

test("uses one application lockfile and npm ci from the repository root", async () => {
  const [rootPackage, lockfiles] = await Promise.all([
    readJson(join(projectDirectory, "package.json")),
    findLockfiles(projectDirectory),
  ]);

  assert.deepEqual(
    lockfiles.map((file) => relative(projectDirectory, file)),
    ["apps/web/package-lock.json"],
  );
  assert.equal(rootPackage.scripts["install-all"], "npm ci --prefix apps/web");
  await access(join(appDirectory, "package-lock.json"));
});

test("keeps strict TypeScript on standard Next.js types", async () => {
  const [appPackage, tsconfig] = await Promise.all([
    readJson(join(appDirectory, "package.json")),
    readJson(join(appDirectory, "tsconfig.json")),
  ]);

  assert.equal(appPackage.scripts.typecheck, "tsc --noEmit");
  assert.equal(tsconfig.compilerOptions.strict, true);
  assert.equal(tsconfig.compilerOptions.noEmit, true);
  assert.equal(tsconfig.compilerOptions.moduleResolution, "bundler");
  assert.deepEqual(tsconfig.compilerOptions.plugins, [{ name: "next" }]);
  assert.equal("types" in tsconfig.compilerOptions, false);
  assert.ok(tsconfig.include.includes("next-env.d.ts"));
  assert.ok(tsconfig.include.includes(".next/types/**/*.ts"));
  assert.doesNotMatch(JSON.stringify(tsconfig), /cloudflare/i);
});

test("documents unavoidable type overrides at verified boundaries", async () => {
  const sourceFiles = await findSourceFiles([
    join(appDirectory, "app"),
    join(appDirectory, "components"),
    join(appDirectory, "lib"),
  ]);
  const undocumentedOverrides = [];

  for (const file of sourceFiles) {
    const source = await readFile(file, "utf8");
    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const sourceLines = source.split(/\r?\n/);

    function visit(node) {
      const isConstAssertion =
        ts.isAsExpression(node) && node.type.getText(sourceFile) === "const";
      const isTypeOverride =
        (ts.isAsExpression(node) && !isConstAssertion) ||
        ts.isTypeAssertionExpression(node) ||
        ts.isNonNullExpression(node);

      if (isTypeOverride) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        const rationale = `${sourceLines[line - 1] ?? ""}\n${sourceLines[line] ?? ""}`;
        if (!/type-boundary:\s*\S/i.test(rationale)) {
          undocumentedOverrides.push(
            `${relative(appDirectory, file)}:${line + 1}`,
          );
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  assert.deepEqual(undocumentedOverrides, []);
});

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function findLockfiles(directory) {
  const lockfiles = [];
  await visitDirectory(directory, lockfiles);
  return lockfiles.toSorted();
}

async function findSourceFiles(directories) {
  const sourceFiles = [];

  for (const directory of directories) {
    await visitSourceDirectory(directory, sourceFiles);
  }

  return sourceFiles.toSorted();
}

async function visitSourceDirectory(directory, sourceFiles) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await visitSourceDirectory(path, sourceFiles);
    } else if (
      entry.isFile() &&
      sourceExtensions.has(entry.name.slice(entry.name.lastIndexOf(".")))
    ) {
      sourceFiles.push(path);
    }
  }
}

async function visitDirectory(directory, lockfiles) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) {
      await visitDirectory(path, lockfiles);
    } else if (entry.isFile() && lockfileNames.has(entry.name)) {
      lockfiles.push(path);
    }
  }
}
