import assert from "node:assert/strict";
import { test } from "node:test";
import { localhostPortArgs } from "./lib/local-docker.mjs";

test("binds project create ports to localhost without touching container commands", () => {
  const input = ["create", "-e", "CONFIG", "-p", "54322:5432", "--network", "freelancercrm-local", "image", "app", "-p", "9999:80"];
  const expected = [...input];
  expected[4] = "127.0.0.1:54322:5432";
  assert.deepEqual(localhostPortArgs(input), expected);
  assert.equal(input[4], "54322:5432");
});
test("handles run, equals syntax, container subcommand and explicit localhost", () => {
  assert.deepEqual(localhostPortArgs(["container", "run", "--rm", "--publish=54321:8000/tcp", "--network=freelancercrm-local", "image"]),
    ["container", "run", "--rm", "--publish=127.0.0.1:54321:8000/tcp", "--network=freelancercrm-local", "image"]);
  const args = ["run", "-p", "127.0.0.1:1234:80", "--network", "freelancercrm-local", "image"];
  assert.deepEqual(localhostPortArgs(args), args);
});
test("leaves other projects and non-creation commands untouched", () => {
  for (const args of [["run", "-p", "9999:80", "--network", "another-project", "image"], ["exec", "db", "command", "-p", "80:80"]]) {
    assert.deepEqual(localhostPortArgs(args), args);
  }
});
test("does not mistake env values for Docker options", () => {
  const args = ["create", "-e", "--publish=1234:80", "--network", "freelancercrm-local", "image"];
  assert.deepEqual(localhostPortArgs(args), args);
});
test("rejects unsupported publish modes and external IPs", () => {
  assert.throws(() => localhostPortArgs(["run", "-P", "--network", "freelancercrm-local", "image"]));
  assert.throws(() => localhostPortArgs(["run", "-p", "0.0.0.0:80:80", "--network", "freelancercrm-local", "image"]));
});
