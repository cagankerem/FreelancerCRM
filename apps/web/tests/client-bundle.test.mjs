import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("..", import.meta.url));
const clientBundleDirectory = join(appDirectory, ".next", "static");
const clientArtifactExtensions = new Set([".js", ".map"]);
const serverOnlyMarkers = [
  "oai-authenticated-user-email",
  "oai-authenticated-user-full-name",
  "/signin-with-chatgpt",
  "/signout-with-chatgpt",
  "chatgpt-auth",
  "lib/server/",
];

test("keeps server-only modules and secrets out of browser artifacts", async () => {
  const browserArtifacts = await collectBrowserArtifacts(clientBundleDirectory);
  assert.ok(browserArtifacts.length > 0, "Expected Next.js browser artifacts after build.");

  const leakedMarkers = [];

  for (const file of browserArtifacts) {
    const content = await readFile(file, "utf8");

    for (const marker of serverOnlyMarkers) {
      if (content.toLowerCase().includes(marker.toLowerCase())) {
        leakedMarkers.push(`${relative(appDirectory, file)}: ${marker}`);
      }
    }
  }

  assert.deepEqual(leakedMarkers, []);
});

async function collectBrowserArtifacts(directory) {
  const artifacts = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      artifacts.push(...(await collectBrowserArtifacts(path)));
    } else if (entry.isFile() && clientArtifactExtensions.has(extname(entry.name))) {
      artifacts.push(path);
    }
  }

  return artifacts.toSorted();
}
