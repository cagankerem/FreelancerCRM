import { expect, test } from "@playwright/test";

test("callback missing code cannot redirect to an external next", async ({ request }) => {
  const response = await request.get(
    "http://localhost:3000/auth/callback?next=https://evil.example",
    { maxRedirects: 0 },
  );
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("http://localhost:3000/auth/login?error=invalid");
  expect(response.headers()["referrer-policy"]).toBe("no-referrer");
});

test("untrusted callback origin is refused without setting a session", async ({ request }) => {
  const response = await request.get("/auth/callback?code=invalid", { maxRedirects: 0 });
  expect(response.status()).toBe(400);
  expect(response.headers()["set-cookie"]).toBeUndefined();
});

test("public referrers remain private and auth forms retain same-origin CSRF metadata", async ({
  request,
}) => {
  expect((await request.get("/")).headers()["referrer-policy"]).toBe("no-referrer");
  expect((await request.get("/auth/register")).headers()["referrer-policy"]).toBe("same-origin");
});

test("foreign-origin server action form is rejected", async ({ request }) => {
  const response = await request.post("/auth/register", {
    headers: {
      Origin: "https://evil.example",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: "email=synthetic%40example.invalid&password=unused",
  });
  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
});
