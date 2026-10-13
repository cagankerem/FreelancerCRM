import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import { openPreview, sealPreview, validateArchiveListing } from "./lib/preview-envelope.mjs";

const pair = () =>
  generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
const keys = pair();
test("server build is opaque until protected private-key decryption", () => {
  const payload = Buffer.from("synthetic-prerender-secret-" + "A".repeat(64));
  const sealed = sealPreview(payload, keys.publicKey);
  assert.ok(!sealed.includes(payload));
  assert.deepEqual(openPreview(sealed, keys.privateKey), payload);
});
test("tampered, truncated and wrong-key artifacts fail authentication", () => {
  const sealed = sealPreview(Buffer.from("synthetic build"), keys.publicKey);
  const altered = Buffer.from(sealed);
  altered[altered.length - 1] ^= 1;
  assert.throws(() => openPreview(altered, keys.privateKey));
  assert.throws(() => openPreview(sealed.subarray(0, 20), keys.privateKey));
  assert.throws(() => openPreview(sealed, pair().privateKey));
});
test("archive permits only regular build files and blocks traversal/links", () => {
  validateArchiveListing("server/_next/static/framework~index.js", "- regular");
  validateArchiveListing(
    "server/index.js\nclient/favicon.svg\npreview-metadata.json",
    "- regular\n- regular\n- regular",
  );
  for (const invalid of ["../escape", "/server/index.js", "server/../../escape", "scripts/run.js"])
    assert.throws(() => validateArchiveListing(invalid, "- regular"));
  for (const type of ["l", "h", "c", "b", "p"])
    assert.throws(() => validateArchiveListing("server/index.js", `${type} link`));
});
