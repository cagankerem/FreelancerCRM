import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { setTimeout } from "node:timers/promises";

// Human-assisted acceptance: no inbox access, admin confirmation, generated link,
// password login, screenshots, traces, or raw URL/token logging.
const origin = "https://freelancercrm-staging.cagankeremergun.workers.dev";
const project = "pbqgjfzylnhaiadlpvkq";
const require = createRequire(resolve(import.meta.dirname, "../apps/web/package.json"));
const { chromium } = require("@playwright/test");
let browser;
let step = "preflight";
try {
  assert.notEqual(process.env.CI, "true");
  const email = process.env.AUTH_TEST_EMAIL;
  assert.ok(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  const registry = readFileSync(
    resolve(import.meta.dirname, "../apps/web/lib/shared/supabase-projects.ts"),
    "utf8",
  );
  const publicKey = registry.match(/test:\s*\{[\s\S]*?publishableKey:\s*"([^"]+)"/)?.[1];
  assert.ok(publicKey?.startsWith("sb_publishable_"));
  const settings = await fetch(`https://${project}.supabase.co/auth/v1/settings`, {
    headers: { apikey: publicKey },
    signal: AbortSignal.timeout(15000),
  });
  assert.ok(settings.ok);
  const config = await settings.json();
  assert.equal(config.mailer_autoconfirm, false);
  assert.equal(config.external.email, true);
  browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  let blockedRequests = 0;
  const hosts = new Set([new URL(origin).hostname, `${project}.supabase.co`]);
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.protocol === "https:" && hosts.has(url.hostname)) return route.continue();
    blockedRequests++;
    return route.abort();
  });
  let callbackRedirect = false;
  context.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin !== origin || url.pathname !== "/auth/callback" || !url.searchParams.has("code"))
      return;
    const headers = response.headers();
    callbackRedirect =
      [302, 303, 307, 308].includes(response.status()) &&
      headers.location === `${origin}/onboarding` &&
      headers["referrer-policy"] === "no-referrer";
  });
  const page = await context.newPage();
  const reportCookies = async () => {
    const cookies = await context.cookies(`${origin}/auth/callback`);
    const legacy = cookies.find(
      (cookie) => cookie.name === `sb-${project}-auth-token-code-verifier`,
    );
    let validLegacyVerifier = false;
    try {
      validLegacyVerifier =
        legacy?.value.startsWith("base64-") &&
        typeof JSON.parse(Buffer.from(legacy.value.slice(7), "base64url").toString()) === "string";
    } catch {
      // Never print a malformed cookie value.
    }
    console.log(
      JSON.stringify({
        event: "pkce_cookie_diagnostic",
        legacyVerifierPresent: Boolean(legacy),
        validLegacyVerifier: Boolean(validLegacyVerifier),
        verifierCookieCount: cookies.filter((cookie) => cookie.name.includes("code-verifier"))
          .length,
      }),
    );
  };
  context.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin === origin && url.pathname === "/auth/callback") {
      console.log(
        JSON.stringify({
          event: "callback_request",
          hasCode: url.searchParams.has("code"),
          hasFlowId: url.searchParams.has("sb_flow_id"),
        }),
      );
      void reportCookies().catch(() =>
        console.log("Cookie diagnostic unavailable; values omitted."),
      );
    }
  });
  context.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin !== origin || url.pathname !== "/auth/callback") return;
    const location = response.headers().location;
    const target = location ? new URL(location, origin) : null;
    console.log(
      JSON.stringify({
        event: "callback_response",
        status: response.status(),
        redirectedToOnboarding: target?.origin === origin && target.pathname === "/onboarding",
        redirectedToLoginError:
          target?.origin === origin &&
          target.pathname === "/auth/login" &&
          target.searchParams.has("error"),
      }),
    );
  });
  step = "registration";
  await page.goto(`${origin}/auth/register`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(`${randomBytes(24).toString("base64url")}!aA1`);
  await page.getByRole("button", { name: "Kayıt ol", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "e-posta doğrulama" }).waitFor();
  const prefix = `sb-${project}-auth-token`;
  const pending = await context.cookies();
  assert.ok(
    !pending.some((cookie) => cookie.name === prefix || cookie.name.startsWith(`${prefix}.`)),
  );
  assert.ok(pending.some((cookie) => cookie.name.includes("code-verifier") && cookie.secure));
  await reportCookies();
  // Keep this human-assisted attempt on the email path, not password login.
  // This changes only the temporary test browser's DOM, never the application.
  await page.evaluate(() => {
    for (const input of document.querySelectorAll("form input, form button")) {
      input.setAttribute("disabled", "");
    }
    const note = document.createElement("p");
    note.textContent =
      "E-posta testi bekleniyor. Giriş formunu kullanmayın. Yalnız en son doğrulama e-postasının bağlantısını bu pencerenin adres çubuğuna yapıştırın.";
    document.querySelector("main")?.prepend(note);
  });
  console.log(
    "WAITING_FOR_EMAIL: signup requested; no session before verification; Secure PKCE verifier present. Paste the ORIGINAL email confirmation link into this Chromium window, not into chat or another browser.",
  );

  step = "email_callback_wait";
  const deadline = Date.now() + 20 * 60_000;
  let authenticatedPage;
  while (Date.now() < deadline && browser.isConnected()) {
    if (callbackRedirect) {
      authenticatedPage = context
        .pages()
        .find((candidate) => candidate.url() === `${origin}/onboarding`);
      if (authenticatedPage) break;
    }
    await setTimeout(1000);
  }
  assert.ok(authenticatedPage && callbackRedirect);
  step = "session_validation";
  await authenticatedPage.getByRole("heading", { name: "Profilini tamamla" }).waitFor();
  const cookies = (await context.cookies())
    .filter((cookie) => cookie.name === prefix || cookie.name.startsWith(`${prefix}.`))
    .sort((a, b) => a.name.localeCompare(b.name));
  assert.ok(cookies.length > 0);
  assert.ok(
    cookies.every(
      (cookie) =>
        cookie.secure && cookie.sameSite === "Lax" && cookie.domain === new URL(origin).hostname,
    ),
  );
  const encoded = cookies.map((cookie) => cookie.value).join("");
  assert.ok(encoded.startsWith("base64-"));
  const session = JSON.parse(Buffer.from(encoded.slice(7), "base64url").toString());
  const validated = await fetch(`https://${project}.supabase.co/auth/v1/user`, {
    headers: { apikey: publicKey, Authorization: `Bearer ${session.access_token}` },
    signal: AbortSignal.timeout(15000),
  });
  assert.ok(validated.ok);
  const user = await validated.json();
  assert.equal(user.email?.toLowerCase(), email.toLowerCase());
  assert.ok(user.email_confirmed_at);
  await authenticatedPage.goto(`${origin}/app`);
  await authenticatedPage.getByRole("heading", { name: "Profilini tamamla" }).waitFor();
  assert.equal(blockedRequests, 0);
  console.log(
    "PASS: actual signup, human email verification, HTTPS code callback, confirmed Auth identity, Secure/SameSite=Lax session and protected route access. No production requests.",
  );
  step = "signout";
  const signedOut = await fetch(`https://${project}.supabase.co/auth/v1/logout`, {
    method: "POST",
    headers: { apikey: publicKey, Authorization: `Bearer ${session.access_token}` },
    signal: AbortSignal.timeout(15000),
  });
  assert.ok(signedOut.ok);
  await context.clearCookies();
  await authenticatedPage.goto(`${origin}/app`);
  await authenticatedPage.getByRole("heading", { name: "Giriş yap", exact: true }).waitFor();
  console.log(
    "PASS: test session signed out; account retained, no user data deleted. Random test password was never stored or printed.",
  );
} catch {
  console.error(
    `Email Auth acceptance did not complete at step: ${step}. Raw errors, URLs and credentials omitted; no automatic retry or account deletion.`,
  );
  process.exitCode = 1;
} finally {
  await browser?.close();
}
