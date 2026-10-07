import assert from "node:assert/strict";

export const projectId = "FreelancerCRM";
export const network = "freelancercrm-local";
export function assertHostedCI(env) {
  assert.equal(env.CI, "true", "DB gate is only for disposable CI");
  assert.equal(env.GITHUB_ACTIONS, "true", "DB gate requires GitHub Actions");
  assert.equal(
    env.RUNNER_ENVIRONMENT,
    "github-hosted",
    "Self-hosted/local database cannot be reset by CI",
  );
  assert.equal(env.RUNNER_OS, "Linux");
  assert.match(env.GITHUB_RUN_ID ?? "", /^\d+$/);
  for (const key of Object.keys(env)) {
    assert.ok(
      !/^(?:SUPABASE_|NEXT_PUBLIC_SUPABASE_|DATABASE_URL$|SHARE_HMAC_)/.test(key),
      "DB gate must not receive application credentials or remote database settings",
    );
  }
}
export function ownedResource(name) {
  return name.startsWith("supabase_") && name.endsWith(`_${projectId}`);
}
export function assertFreshResources(containers, volumes, networks) {
  assert.ok(
    !containers.some(ownedResource) && !volumes.some(ownedResource),
    "Pre-existing Supabase resources: refusing to reset or delete them",
  );
  assert.ok(!networks.includes(network), "Pre-existing local Docker network: refusing to reuse it");
}
