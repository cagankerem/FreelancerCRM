import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import ts from "typescript";

const execFileAsync = promisify(execFile);
const appDirectory = fileURLToPath(new URL("..", import.meta.url));
const sourceRoots = ["app", "components", "lib"].map((directory) =>
  join(appDirectory, directory),
);
const serverDirectory = join(appDirectory, "lib", "server");
const clientDirectory = join(appDirectory, "lib", "client");
const sharedDirectory = join(appDirectory, "lib", "shared");
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
const nextCli = join(appDirectory, "node_modules", "next", "dist", "bin", "next");

const sourceFiles = await collectSourceFiles(sourceRoots);
const sourceFileSet = new Set(sourceFiles);
const sourceByFile = new Map(
  await Promise.all(
    sourceFiles.map(async (file) => [file, await readFile(file, "utf8")]),
  ),
);
const moduleSpecifiersByFile = new Map(
  sourceFiles.map((file) => [file, collectModuleSpecifiers(file, sourceByFile.get(file))]),
);
const localDependenciesByFile = new Map(
  sourceFiles.map((file) => [
    file,
    moduleSpecifiersByFile
      .get(file)
      .map((specifier) => resolveLocalModule(file, specifier))
      .filter(Boolean),
  ]),
);

test("every server module declares the server-only guard", () => {
  const serverFiles = sourceFiles.filter((file) => isWithin(file, serverDirectory));
  assert.ok(serverFiles.length > 0, "Expected at least one lib/server module.");

  for (const file of serverFiles) {
    const sourceFile = parseSourceFile(file, sourceByFile.get(file));
    const firstStatement = sourceFile.statements[0];

    assert.ok(
      firstStatement &&
        ts.isImportDeclaration(firstStatement) &&
        firstStatement.importClause === undefined &&
        firstStatement.moduleSpecifier.text === "server-only",
      `${displayPath(file)} must start with import "server-only";`,
    );
    assert.equal(
      hasDirective(sourceFile, "use client"),
      false,
      `${displayPath(file)} cannot be a Client Component module.`,
    );
  }
});

test("client modules cannot reach lib/server through the local import graph", () => {
  const clientEntryFiles = sourceFiles.filter((file) => {
    const sourceFile = parseSourceFile(file, sourceByFile.get(file));
    return hasDirective(sourceFile, "use client") || isWithin(file, clientDirectory);
  });

  for (const clientEntryFile of clientEntryFiles) {
    const forbiddenPath = findDependencyPath(clientEntryFile, serverDirectory);
    assert.equal(
      forbiddenPath,
      null,
      `${displayPath(clientEntryFile)} reaches lib/server: ${forbiddenPath?.map(displayPath).join(" -> ")}`,
    );
  }
});

test("server and shared layers keep one-way runtime dependencies", () => {
  for (const serverFile of sourceFiles.filter((file) => isWithin(file, serverDirectory))) {
    const forbiddenPath = findDependencyPath(serverFile, clientDirectory);
    assert.equal(
      forbiddenPath,
      null,
      `${displayPath(serverFile)} reaches lib/client: ${forbiddenPath?.map(displayPath).join(" -> ")}`,
    );
  }

  for (const sharedFile of sourceFiles.filter((file) => isWithin(file, sharedDirectory))) {
    const source = sourceByFile.get(sharedFile);
    const imports = moduleSpecifiersByFile.get(sharedFile);
    const forbiddenFrameworkImport = imports.find(
      (specifier) =>
        specifier === "react" ||
        specifier.startsWith("react/") ||
        specifier === "next" ||
        specifier.startsWith("next/") ||
        specifier === "server-only" ||
        specifier === "client-only",
    );

    assert.equal(
      forbiddenFrameworkImport,
      undefined,
      `${displayPath(sharedFile)} imports framework runtime ${forbiddenFrameworkImport}.`,
    );
    assert.doesNotMatch(
      source,
      /\b(?:process\.env|import\.meta\.env)\b/,
      `${displayPath(sharedFile)} cannot read runtime environment variables.`,
    );
    assert.equal(
      findDependencyPath(sharedFile, serverDirectory),
      null,
      `${displayPath(sharedFile)} cannot reach lib/server.`,
    );
    assert.equal(
      findDependencyPath(sharedFile, clientDirectory),
      null,
      `${displayPath(sharedFile)} cannot reach lib/client.`,
    );
  }
});

test("secrets and server exports stay inside lib/server", () => {
  for (const file of sourceFiles.filter((candidate) => !isWithin(candidate, serverDirectory))) {
    const source = sourceByFile.get(file);
    const imports = moduleSpecifiersByFile.get(file);
    const forbiddenEnvironmentAccess = findForbiddenEnvironmentAccess(source);

    assert.equal(
      imports.includes("server-only"),
      false,
      `${displayPath(file)} cannot declare itself server-only outside lib/server.`,
    );
    assert.equal(
      forbiddenEnvironmentAccess,
      null,
      `${displayPath(file)} contains non-public environment access: ${forbiddenEnvironmentAccess}.`,
    );

    for (const specifier of collectReExportSpecifiers(file, source)) {
      const exportedModule = resolveLocalModule(file, specifier);
      assert.equal(
        Boolean(exportedModule && isWithin(exportedModule, serverDirectory)),
        false,
        `${displayPath(file)} cannot re-export ${exportedModule ? displayPath(exportedModule) : specifier} from lib/server.`,
      );
    }
  }
});

test(
  "Next.js rejects server-only code imported into a Client Component",
  { timeout: 60_000 },
  async () => {
    const fixtureDirectory = await createInvalidClientImportFixture();

    try {
      let buildOutput = "";
      let buildFailed = false;

      try {
        await execFileAsync(process.execPath, [nextCli, "build", "--webpack"], {
          cwd: fixtureDirectory,
          env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
          maxBuffer: 10 * 1024 * 1024,
        });
      } catch (error) {
        buildFailed = true;
        buildOutput = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
      }

      assert.equal(buildFailed, true, "The invalid client import unexpectedly built successfully.");
      assert.match(buildOutput, /depends on ["']server-only["']/i);
      assert.match(
        buildOutput,
        /only available in Server Components|cannot be imported from a Client Component/i,
      );
      assert.match(buildOutput, /Import trace[\s\S]*\.\/app\/page\.tsx/i);
    } finally {
      await rm(fixtureDirectory, { recursive: true, force: true });
    }
  },
);

async function collectSourceFiles(directories) {
  const files = [];

  for (const directory of directories) {
    await visitDirectory(directory, files);
  }

  return files.toSorted();
}

async function visitDirectory(directory, files) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await visitDirectory(path, files);
    } else if (entry.isFile() && sourceExtensions.has(extname(entry.name))) {
      files.push(resolve(path));
    }
  }
}

function parseSourceFile(file, source) {
  const scriptKind = file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind);
}

function collectModuleSpecifiers(file, source) {
  const sourceFile = parseSourceFile(file, source);
  const specifiers = [];

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0]) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require"))
    ) {
      specifiers.push(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

function collectReExportSpecifiers(file, source) {
  return parseSourceFile(file, source).statements
    .filter(
      (statement) =>
        ts.isExportDeclaration(statement) &&
        statement.moduleSpecifier &&
        ts.isStringLiteral(statement.moduleSpecifier),
    )
    .map((statement) => statement.moduleSpecifier.text);
}

function findForbiddenEnvironmentAccess(source) {
  if (/\bimport\.meta\.env\b/.test(source)) return "import.meta.env";

  const environmentAccessPattern =
    /\bprocess\.env(?:\.([A-Za-z_][A-Za-z0-9_]*)|\[\s*["']([^"']+)["']\s*\])?/g;

  for (const match of source.matchAll(environmentAccessPattern)) {
    const environmentVariable = match[1] ?? match[2];
    if (!environmentVariable?.startsWith("NEXT_PUBLIC_")) return match[0];
  }

  return null;
}

function hasDirective(sourceFile, directive) {
  return sourceFile.statements.some(
    (statement) =>
      ts.isExpressionStatement(statement) &&
      ts.isStringLiteral(statement.expression) &&
      statement.expression.text === directive,
  );
}

function resolveLocalModule(importingFile, specifier) {
  let basePath;

  if (specifier.startsWith("@/")) {
    basePath = join(appDirectory, specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    basePath = resolve(dirname(importingFile), specifier);
  } else {
    return null;
  }

  const candidates = extname(basePath)
    ? [basePath]
    : [
        ...[...sourceExtensions].map((extension) => `${basePath}${extension}`),
        ...[...sourceExtensions].map((extension) => join(basePath, `index${extension}`)),
      ];

  return (
    candidates
      .map((candidate) => resolve(candidate))
      .find((candidate) => sourceFileSet.has(candidate)) ?? null
  );
}

function findDependencyPath(entryFile, forbiddenDirectory) {
  const pathsToVisit = [[entryFile]];
  const visited = new Set();

  while (pathsToVisit.length > 0) {
    const path = pathsToVisit.shift();
    const currentFile = path.at(-1);
    if (visited.has(currentFile)) continue;
    visited.add(currentFile);

    if (currentFile !== entryFile && isWithin(currentFile, forbiddenDirectory)) {
      return path;
    }

    for (const dependency of localDependenciesByFile.get(currentFile) ?? []) {
      pathsToVisit.push([...path, dependency]);
    }
  }

  return null;
}

function isWithin(file, directory) {
  const relativePath = relative(directory, file);
  return relativePath !== "" && !relativePath.startsWith(`..${sep}`) && relativePath !== "..";
}

function displayPath(file) {
  return relative(appDirectory, file) || ".";
}

async function createInvalidClientImportFixture() {
  const fixtureDirectory = await mkdtemp(join(tmpdir(), "kapsam-server-boundary-"));
  const appDirectoryInFixture = join(fixtureDirectory, "app");
  const serverDirectoryInFixture = join(fixtureDirectory, "lib", "server");

  await mkdir(appDirectoryInFixture, { recursive: true });
  await mkdir(serverDirectoryInFixture, { recursive: true });
  await symlink(join(appDirectory, "node_modules"), join(fixtureDirectory, "node_modules"), "dir");

  await Promise.all([
    writeFile(
      join(fixtureDirectory, "package.json"),
      JSON.stringify({ private: true, scripts: { build: "next build" } }, null, 2),
    ),
    writeFile(
      join(fixtureDirectory, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            jsx: "preserve",
            lib: ["dom", "esnext"],
            module: "esnext",
            moduleResolution: "bundler",
            noEmit: true,
            strict: true,
            target: "es2017",
          },
          include: ["**/*.ts", "**/*.tsx"],
        },
        null,
        2,
      ),
    ),
    writeFile(
      join(appDirectoryInFixture, "layout.tsx"),
      'export default function Layout({ children }: { children: React.ReactNode }) { return <html><body>{children}</body></html>; }\n',
    ),
    writeFile(
      join(appDirectoryInFixture, "page.tsx"),
      '"use client";\nimport { readSecret } from "../lib/server/secret";\nexport default function Page() { return <main>{readSecret()}</main>; }\n',
    ),
    writeFile(
      join(serverDirectoryInFixture, "secret.ts"),
      'import "server-only";\nexport function readSecret() { return "not-for-the-client"; }\n',
    ),
  ]);

  return fixtureDirectory;
}
