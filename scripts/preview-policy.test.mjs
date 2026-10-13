import assert from "node:assert/strict";
import { test } from "node:test";
import {
  approvePullRequest,
  callbackList,
  checks,
  repository,
  staging,
  target,
} from "./lib/preview-policy.mjs";

const sha = "a".repeat(40);
const pr = {
  number: 12,
  state: "open",
  draft: false,
  base: { ref: "main", repo: { full_name: repository } },
  head: { sha, repo: { full_name: repository } },
};
const runs = checks.map((name, id) => ({
  name,
  id,
  head_sha: sha,
  status: "completed",
  conclusion: "success",
  app: { id: 15368 },
}));
test("exact reviewed commit with every mandatory check is eligible", () =>
  approvePullRequest(pr, "12", sha, runs));
for (const [name, mutate] of [
  [
    "fork",
    (p) => {
      p.head.repo.full_name = "attacker/repo";
    },
  ],
  [
    "changed SHA",
    (p) => {
      p.head.sha = "b".repeat(40);
    },
  ],
  [
    "closed PR",
    (p) => {
      p.state = "closed";
    },
  ],
  [
    "draft",
    (p) => {
      p.draft = true;
    },
  ],
  [
    "different base",
    (p) => {
      p.base.ref = "other";
    },
  ],
])
  test(`preview rejects ${name}`, () => {
    const p = structuredClone(pr);
    mutate(p);
    assert.throws(() => approvePullRequest(p, 12, sha, runs));
  });
test("failed, missing and spoofed checks cannot authorize deployment", () => {
  assert.throws(() => approvePullRequest(pr, 12, sha, runs.slice(1)));
  for (const patch of [{ conclusion: "failure" }, { status: "in_progress" }, { app: { id: 1 } }]) {
    const altered = structuredClone(runs);
    Object.assign(altered[0], patch);
    assert.throws(() => approvePullRequest(pr, 12, sha, altered));
  }
});
test("newer failure overrides old successful check", () =>
  assert.throws(() =>
    approvePullRequest(pr, 12, sha, [...runs, { ...runs[0], id: 999, conclusion: "failure" }]),
  ));
test("namespace cannot point to staging, another account or injected path", () => {
  for (const value of [0, "01", "12/../staging", "12;echo", "1000000000"])
    assert.throws(() => target(value));
});
test("exact callback append/remove preserves staging and unrelated entries", () => {
  const initial = `${staging}/auth/callback,${target(13).origin}/auth/callback`;
  const added = callbackList(initial, 12, true);
  assert.ok(added.includes(`${target(12).origin}/auth/callback`));
  assert.equal(callbackList(added, 12, false), initial);
  assert.throws(() => callbackList("https://**.workers.dev/**", 12, true));
});
