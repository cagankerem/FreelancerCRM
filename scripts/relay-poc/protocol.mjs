// Local-only experiment. Not imported by the application or deployment build.
export const audience = "freelancercrm-local-relay-poc-v1";
export const transportPath = "/_relay/v1";
export const maxWireBytes = 16384;
export const routes = [
  "public.page",
  "public.api",
  "auth.callback",
  "diagnostic.failure",
  "diagnostic.stream",
  "diagnostic.cookies",
];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const codes = {
  INVALID_INPUT: 400,
  FORBIDDEN: 403,
  REPLAY: 409,
  CAPACITY: 503,
  INTERNAL_ERROR: 500,
};
const encoder = new TextEncoder();
export class RelayFault extends Error {
  constructor(code) {
    super("Local relay rejected.");
    this.code = Object.hasOwn(codes, code) ? code : "INTERNAL_ERROR";
  }
}
export function safeFault(error) {
  const code =
    error instanceof RelayFault && Object.hasOwn(codes, error.code) ? error.code : "INTERNAL_ERROR";
  return {
    code,
    status: codes[code],
    message: code === "INTERNAL_ERROR" ? "İşlem tamamlanamadı." : "İstek kabul edilmedi.",
  };
}
export const isId = (value) => typeof value === "string" && uuid.test(value);
export function localOrigin(value) {
  const url = new URL(value);
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    !url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new RelayFault("FORBIDDEN");
  return url.origin;
}
function encode(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}
function decode(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value))
    throw new RelayFault("INVALID_INPUT");
  try {
    const bytes = Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (c) =>
      c.charCodeAt(0),
    );
    if (encode(bytes) !== value) throw new Error();
    return bytes;
  } catch {
    throw new RelayFault("INVALID_INPUT");
  }
}
export async function importKey(value) {
  const bytes = typeof value === "string" ? decode(value) : value;
  if (!(bytes instanceof Uint8Array) || bytes.length !== 32) throw new RelayFault("FORBIDDEN");
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export function ephemeralKey() {
  return encode(crypto.getRandomValues(new Uint8Array(32)));
}
function validSecret(value) {
  return typeof value === "string" && value.length <= 2048 && !/[\u0000-\u001f\u007f]/.test(value);
}
function aad(value) {
  return encoder.encode(
    JSON.stringify([value.v, value.aud, value.requestId, value.nonce, value.issuedAt, value.route]),
  );
}
export async function seal(route, secret, key, options = {}) {
  const value = {
    v: 1,
    aud: audience,
    requestId: options.requestId ?? crypto.randomUUID(),
    nonce: crypto.randomUUID(),
    issuedAt: options.now ?? Date.now(),
    route,
  };
  if (!routes.includes(route) || !validSecret(secret) || !isId(value.requestId))
    throw new RelayFault("INVALID_INPUT");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad(value) },
    key,
    encoder.encode(JSON.stringify({ secret })),
  );
  return { ...value, iv: encode(iv), box: encode(new Uint8Array(ciphertext)) };
}
export async function open(value, key, consume, now = Date.now()) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join(",") !== "aud,box,issuedAt,iv,nonce,requestId,route,v" ||
    value.v !== 1 ||
    value.aud !== audience ||
    !isId(value.requestId) ||
    !isId(value.nonce) ||
    !routes.includes(value.route) ||
    !Number.isSafeInteger(value.issuedAt) ||
    value.issuedAt < now - 30000 ||
    value.issuedAt > now + 5000 ||
    typeof value.box !== "string" ||
    value.box.length > 8192
  )
    throw new RelayFault("FORBIDDEN");
  const iv = decode(value.iv);
  if (iv.length !== 12) throw new RelayFault("FORBIDDEN");
  let context;
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: aad(value) },
      key,
      decode(value.box),
    );
    context = JSON.parse(new TextDecoder().decode(plaintext));
  } catch {
    throw new RelayFault("FORBIDDEN");
  }
  if (!context || Object.keys(context).join(",") !== "secret" || !validSecret(context.secret))
    throw new RelayFault("FORBIDDEN");
  // Consume only after authenticating. A local single-isolate store is not a production replay system.
  if (!(await consume(value.nonce, value.issuedAt + 30001, now))) throw new RelayFault("REPLAY");
  return { requestId: value.requestId, route: value.route, secret: context.secret };
}
export function localReplayStore(capacity = 1024) {
  const entries = new Map();
  return (nonce, expires, now) => {
    for (const [key, expiry] of entries) if (expiry <= now) entries.delete(key);
    if (entries.has(nonce)) return false;
    if (entries.size >= capacity) throw new RelayFault("CAPACITY");
    entries.set(nonce, expires);
    return true;
  };
}
export async function readWire(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new RelayFault("INVALID_INPUT");
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxWireBytes) {
      await reader.cancel();
      throw new RelayFault("INVALID_INPUT");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new RelayFault("INVALID_INPUT");
  }
}
export function emit(sink, stage, event, requestId, route, status, duration) {
  // No request, URL, header, body, Error, secret or arbitrary string field is accepted.
  const record = {
    time: new Date().toISOString(),
    level: status >= 500 ? "error" : status >= 400 ? "warn" : "info",
    stage: ["gateway", "workerd"].includes(stage) ? stage : "workerd",
    event: [
      "request.started",
      "operation.finished",
      "request.finished",
      "request.rejected",
    ].includes(event)
      ? event
      : "request.rejected",
    requestId: isId(requestId) ? requestId : "[REDACTED]",
    operation: routes.includes(route) ? route : "unknown",
    status: Number.isInteger(status) && status >= 100 && status <= 599 ? status : undefined,
    durationToResponseMs: Number.isFinite(duration)
      ? Math.round(Math.min(86400000, Math.max(0, duration)))
      : undefined,
  };
  try {
    sink(JSON.stringify(record));
  } catch {
    /* Sink failure cannot change the HTTP result. */
  }
}
