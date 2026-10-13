import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { setTimeout } from "node:timers/promises";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(resolve(root, "apps/web/package.json"));
const { createServerClient } = require("@supabase/ssr");
const { createClient } = require("@supabase/supabase-js");
const cases = ["happy", "missing-verifier", "overwritten-verifier", "expired-code", "reused-code"];
let step = "local-status";
let admin;
let initialIds;
const fixtures = [];
function run(command, args, input) {
  const result = spawnSync(command, args, {
    cwd: root,
    input,
    encoding: "utf8",
    timeout: 20000,
    stdio: ["pipe", "pipe", "pipe"],
  });
  assert.ok(!result.error && result.status === 0, "Local command failed; raw output omitted.");
  return result.stdout;
}
function loopback(value) {
  const url = new URL(value);
  assert.ok(url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname));
  return url;
}
function server(url, key, jar) {
  return createServerClient(url, key, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (values) => {
        for (const { name, value, options } of values)
          options.maxAge === 0 ? jar.delete(name) : jar.set(name, value);
      },
    },
  });
}
async function mailboxLink(mailOrigin, fixture, apiOrigin) {
  for (let n = 0; n < 30; n++) {
    const response = await fetch(
      `${mailOrigin}/api/v1/search?query=${encodeURIComponent(`to:${fixture.email}`)}`,
      {
        signal: AbortSignal.timeout(3000),
      },
    );
    if (response.ok) {
      const found = await response.json();
      const own = found.messages?.find((message) =>
        message.To?.some((to) => to.Address === fixture.email),
      );
      if (!own) {
        await setTimeout(500);
        continue;
      }
      fixture.mailId = own.ID;
      const message = await fetch(`${mailOrigin}/api/v1/message/${encodeURIComponent(own.ID)}`, {
        signal: AbortSignal.timeout(3000),
      });
      assert.ok(message.ok);
      const mail = await message.json();
      const html = mail.HTML ?? "";
      for (const match of html.matchAll(/href="([^"]+)"/g)) {
        const url = new URL(match[1].replaceAll("&amp;", "&"));
        assert.equal(url.origin, apiOrigin);
        if (url.pathname === "/auth/v1/verify") return url;
      }
    } else assert.equal(response.status, 404);
    await setTimeout(500);
  }
  throw new Error("Synthetic local email unavailable; content omitted.");
}
try {
  const status = JSON.parse(
    run(process.execPath, [
      "apps/web/node_modules/supabase/dist/supabase.js",
      "--workdir",
      root,
      "status",
      "--output",
      "json",
    ]),
  );
  const api = loopback(status.API_URL).origin;
  const mail = loopback(status.INBUCKET_URL ?? status.MAILPIT_URL).origin;
  assert.equal(api, "http://127.0.0.1:54321");
  assert.equal(mail, "http://127.0.0.1:54324");
  const key = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
  admin = createClient(api, status.SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const before = await admin.auth.admin.listUsers({ perPage: 1000 });
  assert.ok(!before.error && before.data.users.length < 1000);
  initialIds = new Set(before.data.users.map((u) => u.id));
  for (const scenario of cases) {
    step = scenario;
    const username = `authreg-${randomUUID()}`;
    const email = `${username}@kapsam.invalid`;
    const fixture = { email, username, jar: new Map(), client: null, id: null };
    fixtures.push(fixture);
    fixture.client = server(api, key, fixture.jar);
    const sent = await fixture.client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: "http://localhost:3000/auth/callback" },
    });
    assert.ok(
      !sent.error && !sent.data.session,
      "Synthetic local OTP start failed; raw error omitted.",
    );
    const listed = await admin.auth.admin.listUsers({ perPage: 1000 });
    assert.ok(!listed.error);
    const user = listed.data.users.find((u) => u.email === email);
    assert.ok(user && !initialIds.has(user.id));
    fixture.id = user.id;
    const link = await mailboxLink(mail, fixture, api);
    const verified = await fetch(link, { redirect: "manual", signal: AbortSignal.timeout(10000) });
    assert.ok([302, 303, 307].includes(verified.status));
    const target = new URL(verified.headers.get("location"));
    assert.equal(target.origin, "http://localhost:3000");
    const code = target.searchParams.get("code");
    assert.ok(code);
    let exchangeClient = fixture.client;
    if (scenario === "missing-verifier") exchangeClient = server(api, key, new Map());
    if (scenario === "overwritten-verifier") {
      const name = [...fixture.jar.keys()].find((name) =>
        name.endsWith("-auth-token-code-verifier"),
      );
      assert.ok(name);
      fixture.jar.set(
        name,
        `base64-${Buffer.from(JSON.stringify("a".repeat(64))).toString("base64url")}`,
      );
      exchangeClient = server(api, key, fixture.jar);
    }
    if (scenario === "expired-code") {
      assert.match(fixture.id, /^[a-f0-9-]{36}$/);
      const changed = run(
        "docker",
        [
          "exec",
          "-i",
          "supabase_db_FreelancerCRM",
          "psql",
          "-X",
          "-qAt",
          "-v",
          "ON_ERROR_STOP=1",
          "-U",
          "postgres",
          "-d",
          "postgres",
        ],
        `with changed as (update auth.flow_state set created_at=now()-interval '1 day',auth_code_issued_at=now()-interval '1 day' where user_id='${fixture.id}' returning id) select count(*) from changed;`,
      );
      assert.equal(changed.trim(), "1");
    }
    const originalJar = new Map(fixture.jar);
    const result = await exchangeClient.auth.exchangeCodeForSession(code);
    if (["happy", "reused-code"].includes(scenario)) {
      assert.ok(!result.error && result.data.session && result.data.user.id === fixture.id);
      const checked = await exchangeClient.auth.getUser();
      assert.ok(!checked.error && checked.data.user.id === fixture.id);
      if (scenario === "reused-code") {
        // Preserve the matching verifier: failure must be server-side code reuse,
        // not a missing/wrong-cookie shortcut.
        const replay = await server(api, key, originalJar).auth.exchangeCodeForSession(code);
        assert.ok(replay.error && !replay.data.session);
        assert.equal(replay.error.code, "flow_state_not_found");
      }
      const out = await exchangeClient.auth.signOut();
      assert.ok(!out.error);
    } else {
      assert.ok(result.error && !result.data.session);
      assert.equal(
        result.error.code,
        {
          "missing-verifier": "pkce_code_verifier_not_found",
          "overwritten-verifier": "bad_code_verifier",
          "expired-code": "flow_state_expired",
        }[scenario],
      );
    }
    console.log(`ok - local PKCE ${scenario}`);
  }
} catch {
  console.error(
    `Local Auth regression stopped at ${step}; raw email/code/cookie/credentials omitted.`,
  );
  process.exitCode = 1;
} finally {
  if (admin && initialIds) {
    for (const fixture of fixtures.reverse()) {
      const listed = await admin.auth.admin.listUsers({ perPage: 1000 });
      assert.ok(!listed.error);
      const user = listed.data.users.find((u) => u.email === fixture.email);
      if (!user) continue;
      assert.ok(
        user.email === fixture.email &&
          user.email.startsWith("authreg-") &&
          !initialIds.has(user.id),
      );
      const signedOut = await fixture.client.auth.signOut();
      assert.ok(!signedOut.error, "Synthetic session revocation failed.");
      const deleted = await admin.auth.admin.deleteUser(user.id);
      assert.ok(!deleted.error, "Owned synthetic account cleanup failed.");
      const found = await (
        await fetch(
          `http://127.0.0.1:54324/api/v1/search?query=${encodeURIComponent(`to:${fixture.email}`)}`,
          { signal: AbortSignal.timeout(5000) },
        )
      ).json();
      const ids = found.messages
        .filter((message) => message.To?.some((to) => to.Address === fixture.email))
        .map((message) => message.ID);
      if (ids.length) {
        const response = await fetch("http://127.0.0.1:54324/api/v1/messages", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ IDs: ids }),
          signal: AbortSignal.timeout(5000),
        });
        assert.ok(response.ok);
      }
    }
    const after = await admin.auth.admin.listUsers({ perPage: 1000 });
    assert.ok(!after.error);
    assert.deepEqual(
      new Set(after.data.users.map((u) => u.id)),
      initialIds,
      "Pre-existing Auth identities changed.",
    );
    console.log(
      "Verified cleanup: only owned synthetic users/mailboxes removed; pre-existing users retained, database never reset.",
    );
  }
}
