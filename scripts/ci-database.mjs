import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertHostedCI,
  assertFreshResources,
  ownedResource,
  projectId,
  network,
} from "./lib/ci-database-guard.mjs";
import { localDockerEnvironment } from "./lib/local-docker.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = join(root, "apps/web/node_modules/supabase/dist/supabase.js");
const marker = join(root, ".ci-db-owned.json");
const phase = process.argv[2];
function run(command, args, label, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 600_000,
    ...options,
  });
  // CLI output can include local passwords/keys. Never emit raw stdout/stderr.
  if (result.error || result.status !== 0) {
    const sqlState = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.match(
      /\bSQLSTATE\s+([A-Z0-9]{5})\b/,
    )?.[1];
    throw new Error(
      `${label} failed (exit ${result.status ?? "unavailable"}${sqlState ? `; SQLSTATE ${sqlState}` : ""}); raw output omitted. Reproduce the documented local command on a disposable database.`,
    );
  }
  return result.stdout ?? "";
}
function names(kind) {
  return run(
    "docker",
    kind === "container"
      ? ["ps", "-a", "--format", "{{.Names}}"]
      : [kind, "ls", "--format", "{{.Name}}"],
    `List ${kind}`,
  )
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
}
function supabase(args, label) {
  console.log(`DB CI: ${label}`);
  return run(process.execPath, [cli, "--workdir", root, "--network-id", network, ...args], label, {
    env: localDockerEnvironment(),
  });
}
function query(sql) {
  return run(
    "docker",
    [
      "exec",
      "-i",
      `supabase_db_${projectId}`,
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
    "Local SQL verification",
    { input: sql },
  ).trim();
}
function cleanup() {
  if (!existsSync(marker)) {
    console.log("No CI-owned database resources to clean.");
    return;
  }
  const owner = JSON.parse(readFileSync(marker, "utf8"));
  assert.deepEqual(owner, { run: process.env.GITHUB_RUN_ID, project: projectId, network });
  supabase(
    ["stop", "--project-id", projectId, "--no-backup"],
    "Delete CI-owned containers/volumes",
  );
  if (names("network").includes(network))
    run("docker", ["network", "rm", network], "Delete CI-owned network");
  assert.ok(
    !names("container").some(ownedResource) && !names("volume").some(ownedResource),
    "CI resources remain after cleanup",
  );
  unlinkSync(marker);
  console.log("Verified cleanup: CI-owned containers, volumes and network removed.");
}

try {
  assertHostedCI(process.env);
  assert.ok(
    !phase || (["cleanup", "workers"].includes(phase) && process.argv.length === 3),
    "Unknown DB CI operation",
  );
  if (phase === "cleanup") cleanup();
  else {
    assert.equal(existsSync(marker), false, "Existing CI ownership marker");
    assert.equal(
      existsSync(join(root, "supabase/.temp/project-ref")),
      false,
      "Linked remote project forbidden",
    );
    assert.match(
      readFileSync(join(root, "supabase/config.toml"), "utf8"),
      /^project_id = "FreelancerCRM"$/m,
    );
    assertFreshResources(names("container"), names("volume"), names("network"));
    writeFileSync(
      marker,
      JSON.stringify({ run: process.env.GITHUB_RUN_ID, project: projectId, network }),
      { flag: "wx", mode: 0o600 },
    );
    try {
      run(
        "docker",
        [
          "network",
          "create",
          "--driver",
          "bridge",
          "--opt",
          "com.docker.network.bridge.host_binding_ipv4=127.0.0.1",
          network,
        ],
        "Create CI-local network",
      );
      supabase(
        phase === "workers"
          ? [
              "start",
              "-x",
              "studio,storage-api,imgproxy,realtime,edge-runtime,logflare,vector,supavisor",
            ]
          : ["db", "start"],
        "Start disposable local Supabase",
      );
      supabase(["db", "reset", "--local"], "Apply migrations and synthetic seed from scratch");
      const [container] = JSON.parse(
        run("docker", ["inspect", `supabase_db_${projectId}`], "Inspect CI database"),
      );
      for (const bindings of Object.values(container.NetworkSettings.Ports ?? {}))
        for (const binding of bindings ?? []) assert.equal(binding.HostIp, "127.0.0.1");
      assert.equal(query("select count(*) from auth.users"), "2", "Synthetic Auth seed missing");
      assert.equal(
        query("select count(*) from auth.users where email like '%@kapsam.invalid'"),
        "2",
        "Unexpected seed identity",
      );
      assert.equal(query("select count(*) from public.profiles"), "2");
      assert.equal(query("select count(*) from public.clients"), "2");
      assert.equal(query("select count(*) from public.proposals"), "2");
      const migrationCount = readdirSync(join(root, "supabase/migrations")).filter((file) =>
        file.endsWith(".sql"),
      ).length;
      assert.equal(
        Number(query("select count(*) from supabase_migrations.schema_migrations")),
        migrationCount,
        "Migration history incomplete",
      );
      console.log(
        `Clean migration/seed passed: ${migrationCount} migrations; two synthetic users, profiles, clients and drafts.`,
      );
      supabase(["migration", "up", "--local"], "Verify repeated migration application is a no-op");
      for (const file of ["test-local-db.mjs", "test-local-db-concurrency.mjs"]) {
        const output = run(process.execPath, [join(root, "scripts", file)], file);
        // Whitelist only test labels/counts; never dump SQL/CLI reports.
        for (const line of output.split("\n"))
          if (/^(?:ok - |Passed \d+ |Concurrency fixture)/.test(line)) console.log(line);
      }
      assert.equal(
        query("select count(*) from auth.users"),
        "2",
        "DB tests did not clean temporary users",
      );
      supabase(
        ["db", "advisors", "--local", "--type", "security", "--fail-on", "warn"],
        "Local security advisors",
      );
      console.log("SQL isolation/concurrency and local security advisors passed.");
      if (phase === "workers") {
        const envFile = join(root, "apps/web/.env.local");
        assert.equal(
          existsSync(envFile),
          false,
          "Refusing to overwrite local application environment",
        );
        try {
          run(
            process.execPath,
            [join(root, "scripts/setup-local-app-env.mjs")],
            "Create CI-local credentials",
          );
          run("npm", ["run", "workers:build"], "Build Workers against local Supabase");
          run("npm", ["run", "test:workers:runtime"], "Built Workers browser and product checks");
          console.log(
            "Built Workers browser, callback, CSRF and local product smoke checks passed.",
          );
        } finally {
          if (existsSync(envFile)) unlinkSync(envFile);
        }
      }
    } finally {
      cleanup();
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "CI database gate failed");
  process.exitCode = 1;
}
