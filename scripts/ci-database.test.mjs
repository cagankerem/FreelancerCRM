import assert from "node:assert/strict";
import { test } from "node:test";
import { assertHostedCI, assertFreshResources } from "./lib/ci-database-guard.mjs";

const hosted = {
  CI: "true",
  GITHUB_ACTIONS: "true",
  RUNNER_ENVIRONMENT: "github-hosted",
  RUNNER_OS: "Linux",
  GITHUB_RUN_ID: "123",
};
test("DB gate permits only fresh hosted CI without application credentials", () => {
  assertHostedCI(hosted);
  assertFreshResources([], [], []);
  for (const key of ["CI", "GITHUB_ACTIONS", "RUNNER_ENVIRONMENT", "RUNNER_OS", "GITHUB_RUN_ID"])
    assert.throws(() => assertHostedCI({ ...hosted, [key]: undefined }));
  for (const key of [
    "DATABASE_URL",
    "SUPABASE_ACCESS_TOKEN",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SHARE_HMAC_KEY_V1",
  ])
    assert.throws(() => assertHostedCI({ ...hosted, [key]: "forbidden" }));
});
test("DB gate refuses pre-existing containers, volumes or project network", () => {
  assert.throws(() => assertFreshResources(["supabase_db_FreelancerCRM"], [], []));
  assert.throws(() => assertFreshResources([], ["supabase_db_FreelancerCRM"], []));
  assert.throws(() => assertFreshResources([], [], ["freelancercrm-local"]));
  assertFreshResources(["unrelated"], ["other"], ["bridge"]);
});
