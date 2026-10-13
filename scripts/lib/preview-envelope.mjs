import assert from "node:assert/strict";
import {
  constants,
  createCipheriv,
  createDecipheriv,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
} from "node:crypto";

const magic = Buffer.from("FCRM-PREVIEW-ENC-1\0");
const maximum = 64 * 1024 * 1024;

export function sealPreview(payload, publicKey) {
  assert.ok(Buffer.isBuffer(payload) && payload.length > 0 && payload.length <= maximum);
  const key = randomBytes(32);
  try {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    cipher.setAAD(magic);
    const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
    const wrapped = publicEncrypt(
      { key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
      key,
    );
    const length = Buffer.alloc(4);
    length.writeUInt32BE(wrapped.length);
    return Buffer.concat([magic, length, iv, cipher.getAuthTag(), wrapped, ciphertext]);
  } finally {
    key.fill(0);
  }
}

export function openPreview(envelope, privateKey) {
  assert.ok(
    Buffer.isBuffer(envelope) &&
      envelope.length > magic.length + 32 &&
      envelope.length <= maximum + 1024,
    "Invalid sealed artifact size",
  );
  assert.ok(envelope.subarray(0, magic.length).equals(magic), "Invalid sealed artifact version");
  let offset = magic.length;
  const wrappedLength = envelope.readUInt32BE(offset);
  assert.ok(wrappedLength >= 256 && wrappedLength <= 512, "Invalid wrapped key length");
  offset += 4;
  const iv = envelope.subarray(offset, offset + 12);
  offset += 12;
  const tag = envelope.subarray(offset, offset + 16);
  offset += 16;
  assert.ok(envelope.length > offset + wrappedLength, "Truncated sealed artifact");
  const wrapped = envelope.subarray(offset, offset + wrappedLength);
  offset += wrappedLength;
  const key = privateDecrypt(
    { key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    wrapped,
  );
  try {
    assert.equal(key.length, 32, "Invalid encryption key size");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(magic);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(envelope.subarray(offset)), decipher.final()]);
  } finally {
    key.fill(0);
  }
}

export function validateArchiveListing(names, verbose) {
  const entries = names.trim().split("\n");
  assert.ok(entries.length > 0 && entries.length <= 10000);
  for (const name of entries) {
    assert.match(name, /^[A-Za-z0-9_./@+~-]+$/, "Unexpected archive filename");
    assert.ok(
      !name.startsWith("/") && !name.split("/").includes(".."),
      "Archive traversal forbidden",
    );
    assert.ok(
      ["server", "client", "preview-metadata.json"].includes(name.split("/")[0]),
      "Unexpected artifact root",
    );
  }
  for (const line of verbose.trim().split("\n"))
    assert.ok(["-", "d"].includes(line[0]), "Archive links/devices forbidden");
}
