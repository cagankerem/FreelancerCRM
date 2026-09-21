import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { localDockerEnvironment, networkName } from "./lib/local-docker.mjs";

const projectDirectory = fileURLToPath(new URL("../", import.meta.url));
const cliPath = fileURLToPath(
  new URL("../apps/web/node_modules/supabase/dist/supabase.js", import.meta.url),
);
const bindingOption = "com.docker.network.bridge.host_binding_ipv4";

function run(command, args, capture = false, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: projectDirectory,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
    env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (capture && result.stderr) process.stderr.write(result.stderr);
    throw new Error(`${command} failed (exit ${result.status}, signal ${result.signal}).`);
  }
  return result.stdout;
}

try {
  const args = process.argv.slice(2);
  // Help must remain available without a running Docker daemon.
  if (args.length === 1 && ["--help", "--version"].includes(args[0])) {
    run(process.execPath, [cliPath, "start", args[0]]);
  } else {
    assert.equal(args.length, 0, "db:start accepts no overrides; its local network is fixed.");
    const existing = run("docker", ["network", "ls", "--format", "{{.Name}}"], true);
    if (!existing.split(/\r?\n/).includes(networkName)) {
      run("docker", [
        "network", "create", "--driver", "bridge",
        "--opt", `${bindingOption}=127.0.0.1`, networkName,
      ], true);
    }
    const [network] = JSON.parse(run("docker", ["network", "inspect", networkName], true));
    assert.equal(network.Driver, "bridge", "Expected a bridge network.");
    assert.equal(network.EnableIPv6, false, "Expected an IPv4-only local network.");
    assert.equal(
      network.Options?.[bindingOption], "127.0.0.1",
      "Existing freelancercrm-local network is not bound to localhost; refusing to start.",
    );
    console.log("Starting Supabase on localhost using the project-pinned CLI.");
    run(process.execPath, [cliPath, "--workdir", projectDirectory, "start", "--network-id", networkName], false, localDockerEnvironment());
    // Docker Desktop can publish on all interfaces despite the network default.
    // Verify actual bindings before reporting a successful local-only start.
    const ids = run("docker", ["ps", "--filter", `network=${networkName}`, "--format", "{{.ID}}"], true)
      .trim().split(/\r?\n/).filter(Boolean);
    assert.ok(ids.length > 0, "No containers found on the local Supabase network.");
    const containers = JSON.parse(run("docker", ["inspect", ...ids], true))
      .filter((container) => container.Name.startsWith("/supabase_") && container.Name.endsWith("_FreelancerCRM"));
    assert.ok(containers.length > 0, "No FreelancerCRM Supabase containers found.");
    const unsafe = containers.flatMap((container) =>
      Object.values(container.NetworkSettings.Ports ?? {}).flatMap((bindings) =>
        (bindings ?? []).filter((binding) => binding.HostIp !== "127.0.0.1")
          .map((binding) => `${container.Name}: ${binding.HostIp}:${binding.HostPort}`),
      ),
    );
    if (unsafe.length > 0) {
      console.error(`Non-local port bindings detected:\n${unsafe.join("\n")}`);
      run(process.execPath, [cliPath, "--workdir", projectDirectory, "stop"]);
      throw new Error("Stopped local Supabase with data preserved: Docker did not honor localhost bindings.");
    }
    console.log("Verified: published Supabase ports are bound to 127.0.0.1.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
