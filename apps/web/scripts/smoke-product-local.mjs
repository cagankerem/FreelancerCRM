import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const variables = Object.fromEntries(readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .trim().split("\n").map((line) => line.split(/=(.*)/s).slice(0, 2)));
assert.ok(variables.NEXT_PUBLIC_SUPABASE_URL.startsWith("http://127.0.0.1:"), "Local Supabase only.");
const service = createClient(variables.NEXT_PUBLIC_SUPABASE_URL, variables.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const existing = await service.auth.admin.listUsers({ page: 1, perPage: 100 });
if (existing.error) throw new Error("Cannot inspect local smoke accounts.");
if (existing.data.users.some((user) => user.email?.startsWith("product-smoke-") && user.email.endsWith("@example.invalid"))) {
  throw new Error("An earlier product-smoke account remains. Resolve Auth account deletion before another run.");
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

  const auth = createClient(variables.NEXT_PUBLIC_SUPABASE_URL, variables.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
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
  await page.locator('select[name="client_id"]').selectOption({ label: "Test Müşterisi · Kurgusal Şirket" });
  await page.locator('input[name="project_name"]').fill("Kurgusal Mobil Uygulama");
  await page.locator('select[name="tax_mode"]').selectOption("excluded");
  await page.locator('input[name="description"]').fill("Tasarım çalışması");
  await page.locator('input[name="quantity"]').fill("1.5");
  await page.locator('input[name="unit_price"]').fill("100.01");
  await page.getByRole("button", { name: "Taslağı kaydet" }).click();
  await page.getByRole("heading", { name: "Kurgusal Mobil Uygulama" }).waitFor();
  assert.match(await page.locator("main").textContent(), /150\.02 USD/);
  console.log("ok - draft saved with exact line rounding and owner read");
} finally {
  await browser.close();
  if (createdId) {
    const { data, error } = await service.auth.admin.getUserById(createdId);
    if (error || data.user?.email !== email) throw new Error("Test user identity mismatch; manual inspection required.");
    const removed = await service.auth.admin.deleteUser(createdId);
    if (removed.error) throw new Error("Could not remove the exact synthetic smoke user.");
    console.log("Synthetic smoke user and its dependent data removed.");
  }
}
