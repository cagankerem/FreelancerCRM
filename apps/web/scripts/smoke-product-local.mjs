import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const variables = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .trim()
    .split("\n")
    .map((line) => line.split(/=(.*)/s).slice(0, 2)),
);
assert.ok(
  variables.NEXT_PUBLIC_SUPABASE_URL.startsWith("http://127.0.0.1:"),
  "Local Supabase only.",
);
const service = createClient(
  variables.NEXT_PUBLIC_SUPABASE_URL,
  variables.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);
const existing = await service.auth.admin.listUsers({ page: 1, perPage: 100 });
if (existing.error) throw new Error("Cannot inspect local smoke accounts.");
if (
  existing.data.users.some(
    (user) => user.email?.startsWith("product-smoke-") && user.email.endsWith("@example.invalid"),
  )
) {
  throw new Error(
    "An earlier product-smoke account remains. Resolve Auth account deletion before another run.",
  );
}
const email = `product-smoke-${randomUUID()}@example.invalid`;
const password = "YerelSmoke2026!";
const browser = await chromium.launch({ headless: true });
let createdId = null;
try {
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/auth/register");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Kayıt ol" }).click();
  await page.getByRole("heading", { name: "Profilini tamamla" }).waitFor();
  console.log("ok - new Auth user reaches onboarding");

  const auth = createClient(
    variables.NEXT_PUBLIC_SUPABASE_URL,
    variables.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const signIn = await auth.auth.signInWithPassword({ email, password });
  assert.ifError(signIn.error);
  createdId = signIn.data.user.id;

  await page.locator('input[name="full_name"]').fill("Kurgusal Test Kişisi");
  await page.locator('input[name="profession"]').fill("Yazılım geliştirici");
  await page.locator('select[name="default_currency"]').selectOption("USD");
  await page.getByRole("button", { name: "Çalışma alanına geç" }).click();
  await page.getByRole("heading", { name: /Merhaba, Kurgusal Test Kişisi/ }).waitFor();
  console.log("ok - profile onboarding persists");

  await page.goto("http://localhost:3000/app/clients");
  assert.equal(await page.locator(".product-list li").count(), 0, "No other user's clients shown.");
  await page.locator('input[name="name"]').fill("Test Müşterisi");
  await page.locator('input[name="company_name"]').fill("Kurgusal Şirket");
  await page.getByRole("button", { name: "Müşteri ekle" }).click();
  await page.getByText("Test Müşterisi · Kurgusal Şirket").waitFor();
  console.log("ok - owner-only client creation and read");

  await page.goto("http://localhost:3000/app/proposals/new");
  await page
    .locator('select[name="client_id"]')
    .selectOption({ label: "Test Müşterisi · Kurgusal Şirket" });
  await page.locator('input[name="project_name"]').fill("Kurgusal Mobil Uygulama");
  await page.locator('select[name="tax_mode"]').selectOption("excluded");
  await page.locator('input[name="description"]').fill("Tasarım çalışması");
  await page.locator('input[name="quantity"]').fill("1.5");
  await page.locator('input[name="unit_price"]').fill("100.01");
  await page.getByRole("button", { name: "Taslağı kaydet" }).click();
  await page.getByRole("heading", { name: "Kurgusal Mobil Uygulama" }).waitFor();
  assert.match(await page.locator("main").textContent(), /150\.02 USD/);
  console.log("ok - draft saved with exact line rounding and owner read");

  // SSR 0.12.6 writes base64-encoded JSON in numerically chunked cookies.
  // Auth-js refreshes a session whose expires_at is within EXPIRY_MARGIN_MS.
  // Only this freshly created synthetic browser session is changed; values stay in memory.
  const jar = await page.context().cookies();
  const sessionCookies = jar.filter((cookie) => /-auth-token(?:\.\d+)?$/.test(cookie.name));
  assert.ok(sessionCookies.length > 0, "Synthetic session cookie missing.");
  const ordered = sessionCookies.sort(
    (a, b) => Number(a.name.split(".")[1] ?? 0) - Number(b.name.split(".")[1] ?? 0),
  );
  const encoded = ordered.map((cookie) => cookie.value).join("");
  assert.ok(encoded.startsWith("base64-"), "Unexpected SSR cookie encoding.");
  let session;
  try {
    session = JSON.parse(Buffer.from(encoded.slice(7), "base64url").toString("utf8"));
  } catch {
    throw new Error("Synthetic cookie could not be decoded; its value is not emitted.");
  }
  assert.ok(typeof session.refresh_token === "string", "Synthetic refresh token missing.");
  session.expires_at = 1;
  const expired = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  const baseName = ordered[0].name.replace(/\.\d+$/, "");
  await page.context().clearCookies({
    name: new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\.\\d+)?$`),
  });
  const chunks = [];
  for (let offset = 0; offset < expired.length; offset += 3000)
    chunks.push(expired.slice(offset, offset + 3000));
  await page.context().addCookies(
    chunks.map((value, index) => ({
      ...ordered[0],
      name: chunks.length === 1 ? baseName : `${baseName}.${index}`,
      value,
    })),
  );
  const refreshed = await page.goto("http://localhost:3000/app");
  assert.equal(refreshed.status(), 200);
  assert.ok(
    (await refreshed.headerValues("set-cookie")).length > 0,
    "Proxy dropped refresh Set-Cookie.",
  );
  assert.match(refreshed.headers()["x-request-id"] ?? "", /^[0-9a-f-]{36}$/);
  await page.getByRole("heading", { name: /Merhaba, Kurgusal Test Kişisi/ }).waitFor();
  console.log("ok - expired synthetic cookie refresh preserves response cookies and request ID");
  const logoutResponse = page.waitForResponse((response) => response.request().method() === "POST");
  await page.getByRole("button", { name: "Çıkış", exact: true }).click();
  const signedOut = await logoutResponse;
  assert.match(signedOut.headers()["x-request-id"] ?? "", /^[0-9a-f-]{36}$/);
  await page.waitForURL("**/auth/login");
  assert.equal(
    (await page.context().cookies()).filter((cookie) => /-auth-token(?:\.\d+)?$/.test(cookie.name))
      .length,
    0,
    "Logout did not clear synthetic session cookies.",
  );
  console.log("ok - logout Server Action keeps redirect/request ID and clears session cookies");
} finally {
  await browser.close();
  if (createdId) {
    const { data, error } = await service.auth.admin.getUserById(createdId);
    if (error || data.user?.email !== email)
      throw new Error("Test user identity mismatch; manual inspection required.");
    const removed = await service.auth.admin.deleteUser(createdId);
    if (removed.error) throw new Error("Could not remove the exact synthetic smoke user.");
    console.log("Synthetic smoke user and its dependent data removed.");
  }
}
