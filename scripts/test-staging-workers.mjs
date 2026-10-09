import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { stagingOrigin, testProjectRef, testSecretKey } from "./lib/supabase-management.mjs";

assert.notEqual(process.env.CI, "true", "Remote staging tests must never run in PR quality CI.");
const require = createRequire(resolve(import.meta.dirname, "../apps/web/package.json"));
const { chromium } = require("@playwright/test");
const { createClient } = require("@supabase/supabase-js");
const db = createClient(`https://${testProjectRef}.supabase.co`, await testSecretKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const accounts = [];
const browser = await chromium.launch({ headless: true });
let context;
try {
  const email = `workers-smoke-${randomUUID()}@example.invalid`;
  const password = `${randomBytes(24).toString("base64url")}!aA1`;
  const created = await db.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ok(
    !created.error && created.data.user,
    "Synthetic test user creation failed; raw response omitted.",
  );
  accounts.push({ id: created.data.user.id, email });
  context = await browser.newContext();
  let unapprovedRequests = 0;
  const allowedHosts = new Set([new URL(stagingOrigin).hostname, `${testProjectRef}.supabase.co`]);
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.protocol === "https:" && allowedHosts.has(url.hostname)) return route.continue();
    unapprovedRequests++;
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto(`${stagingOrigin}/auth/login`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await page.getByRole("heading", { name: "Profilini tamamla" }).waitFor();
  console.log(
    "ok - HTTPS password login reaches onboarding (admin-confirmed synthetic account; email callback not tested)",
  );
  const cookies = (await context.cookies()).filter((c) =>
    c.name.startsWith(`sb-${testProjectRef}-auth-token`),
  );
  assert.ok(cookies.length > 0, "Session cookie missing.");
  assert.ok(
    cookies.every(
      (c) => c.secure && c.sameSite === "Lax" && c.domain === new URL(stagingOrigin).hostname,
    ),
    "Cloud session cookie security attributes are invalid.",
  );
  console.log("ok - session cookies are scoped to staging and Secure/SameSite=Lax");
  await page.locator('input[name="full_name"]').fill("Workers Sentetik Kullanıcı");
  await page.locator('input[name="profession"]').fill("Yazılım geliştirici");
  await page.locator('select[name="default_currency"]').selectOption("USD");
  await page.getByRole("button", { name: "Çalışma alanına geç" }).click();
  await page.getByRole("heading", { name: /Merhaba, Workers Sentetik Kullanıcı/ }).waitFor();
  await page.goto(`${stagingOrigin}/app/clients`);
  await page.locator('input[name="name"]').fill("Workers Test Müşterisi");
  await page.locator('input[name="company_name"]').fill("Sentetik Şirket");
  await page.getByRole("button", { name: "Müşteri ekle" }).click();
  await page.getByText("Workers Test Müşterisi · Sentetik Şirket").waitFor();
  await page.goto(`${stagingOrigin}/app/proposals/new`);
  await page
    .locator('select[name="client_id"]')
    .selectOption({ label: "Workers Test Müşterisi · Sentetik Şirket" });
  await page.locator('input[name="project_name"]').fill("Workers Sentetik Teklif");
  await page.locator('select[name="tax_mode"]').selectOption("excluded");
  await page.locator('input[name="description"]').fill("Sentetik hizmet");
  await page.locator('input[name="quantity"]').fill("1.5");
  await page.locator('input[name="unit_price"]').fill("100.01");
  await page.getByRole("button", { name: "Taslağı kaydet" }).click();
  await page.getByRole("heading", { name: "Workers Sentetik Teklif" }).waitFor();
  assert.ok(
    (await page.locator("main").textContent()).includes("150.02 USD"),
    "Exact amount differs.",
  );
  const proposalId = new URL(page.url()).pathname.split("/").at(-1);
  const expiry = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
  await page.locator('input[name="validDate"]').fill(expiry);
  await page.getByRole("button", { name: "Teklifi yayınla" }).click();
  const link = page.locator('a[href^="/p/"]');
  await link.waitFor();
  const path = await link.getAttribute("href");
  assert.ok(path?.startsWith("/p/"), "Share link missing.");
  const publicResponse = await fetch(`${stagingOrigin}/api/public/proposals/${path.slice(3)}`, {
    signal: AbortSignal.timeout(20_000),
  });
  assert.equal(publicResponse.status, 200, "Public proposal resolver failed.");
  assert.equal(publicResponse.headers.get("referrer-policy"), "no-referrer");
  console.log(
    "ok - HTTPS profile/client/draft/publish/public resolver (node crypto, Buffer and runtime secret binding)",
  );
  const secondEmail = `workers-smoke-${randomUUID()}@example.invalid`;
  const second = await db.auth.admin.createUser({
    email: secondEmail,
    password,
    email_confirm: true,
  });
  assert.ok(!second.error && second.data.user, "Second synthetic user creation failed.");
  accounts.push({ id: second.data.user.id, email: secondEmail });
  const registry = await import("node:fs");
  const text = registry.readFileSync(
    resolve(import.meta.dirname, "../apps/web/lib/shared/supabase-projects.ts"),
    "utf8",
  );
  const publicKey = text.match(/test:\s*\{[\s\S]*?publishableKey:\s*"([^"]+)"/)?.[1];
  assert.ok(publicKey, "Test public key missing.");
  const other = createClient(`https://${testProjectRef}.supabase.co`, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signed = await other.auth.signInWithPassword({ email: secondEmail, password });
  assert.ok(!signed.error, "Second user login failed.");
  const isolated = await other.from("proposals").select("id").eq("id", proposalId);
  assert.ok(!isolated.error && isolated.data.length === 0, "Cross-user RLS isolation failed.");
  await other.auth.signOut();
  console.log("ok - cross-user RLS isolation on the test project");
  const currentCookies = (await context.cookies())
    .filter((c) => c.name.startsWith(`sb-${testProjectRef}-auth-token`))
    .sort((a, b) => a.name.localeCompare(b.name));
  const value = currentCookies.map((c) => c.value).join("");
  assert.ok(value.startsWith("base64-"), "Unexpected session encoding; no cookie values emitted.");
  const session = JSON.parse(Buffer.from(value.slice(7), "base64url").toString());
  const previousAccess = session.access_token;
  const parts = session.access_token.split(".");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  assert.equal(
    payload.iss,
    `https://${testProjectRef}.supabase.co/auth/v1`,
    "Session issuer mismatch.",
  );
  payload.exp = 1;
  session.access_token = `${parts[0]}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${parts[2]}`;
  session.expires_at = 1;
  const replacement = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  const chunks = [];
  for (let start = 0; start < replacement.length; start += 3180)
    chunks.push(replacement.slice(start, start + 3180));
  await context.clearCookies();
  await context.addCookies(
    chunks.map((value, index) => ({
      name:
        chunks.length === 1
          ? `sb-${testProjectRef}-auth-token`
          : `sb-${testProjectRef}-auth-token.${index}`,
      value,
      domain: new URL(stagingOrigin).hostname,
      path: "/",
      secure: true,
      sameSite: "Lax",
    })),
  );
  await page.goto(`${stagingOrigin}/app`);
  await page.getByRole("heading", { name: /Merhaba, Workers Sentetik Kullanıcı/ }).waitFor();
  const renewedCookies = (await context.cookies())
    .filter((c) => c.name.startsWith(`sb-${testProjectRef}-auth-token`))
    .sort((a, b) => a.name.localeCompare(b.name));
  const renewed = JSON.parse(
    Buffer.from(
      renewedCookies
        .map((c) => c.value)
        .join("")
        .slice(7),
      "base64url",
    ).toString(),
  );
  assert.ok(
    renewed.access_token !== previousAccess && renewed.expires_at > Date.now() / 1000,
    "Session was not renewed.",
  );
  assert.ok(
    renewedCookies.every((c) => c.secure),
    "Renewed cookies lost Secure flag.",
  );
  console.log("ok - expired access cookie is replaced using a real refresh session");
  await page.getByRole("button", { name: "Çıkış yap" }).click();
  await page.getByRole("heading", { name: "Giriş yap" }).waitFor();
  await page.goto(`${stagingOrigin}/app`);
  await page.getByRole("heading", { name: "Giriş yap" }).waitFor();
  const callback = await context.request.get(
    `${stagingOrigin}/auth/callback?code=invalid&next=https://evil.example`,
    { maxRedirects: 0 },
  );
  assert.equal(callback.headers().location, `${stagingOrigin}/auth/login?error=invalid`);
  assert.equal(unapprovedRequests, 0, "Browser attempted an unapproved host.");
  console.log(
    "ok - logout/anonymous route guard and invalid callback safe redirect; no production requests",
  );
} finally {
  await browser.close();
  for (const account of accounts.reverse()) {
    const identity = await db.auth.admin.getUserById(account.id);
    assert.ok(
      !identity.error && identity.data.user.email === account.email,
      "Synthetic account identity mismatch; refusing deletion.",
    );
    const result = await db.auth.admin.deleteUser(account.id);
    assert.ok(!result.error, "Synthetic account cleanup failed; inspect test project.");
  }
  console.log(
    `Cleaned up ${accounts.length} exact synthetic test accounts and dependent records; pre-existing data untouched.`,
  );
}
