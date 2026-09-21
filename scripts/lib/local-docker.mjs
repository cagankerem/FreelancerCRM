import assert from "node:assert/strict";
import { accessSync, constants, realpathSync } from "node:fs";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";

export const networkName = "freelancercrm-local";
const shimDirectory = fileURLToPath(new URL("../docker-local/", import.meta.url));

export function localDockerEnvironment() {
  const searchPath = process.env.PATH ?? "";
  for (const directory of searchPath.split(delimiter)) {
    const candidate = join(directory, "docker");
    try {
      accessSync(candidate, constants.X_OK);
      if (realpathSync(candidate) === realpathSync(join(shimDirectory, "docker"))) continue;
      return {
        ...process.env,
        FREELANCERCRM_DOCKER_BIN: realpathSync(candidate),
        PATH: `${shimDirectory}${delimiter}${searchPath}`,
      };
    } catch { /* Try the next executable on PATH. */ }
  }
  throw new Error("Docker executable not found on PATH.");
}

// These are the flags emitted by the pinned Supabase CLI's create/run builders.
// Parse only Docker options; never rewrite a command inside a container.
const valueFlags = new Set([
  "-p", "--publish", "-e", "--env", "--env-file", "-v", "--volume",
  "--name", "--hostname", "--volumes-from", "--tmpfs", "--expose",
  "--health-cmd", "--health-interval", "--health-timeout", "--health-retries",
  "--health-start-period", "--health-start-interval", "--restart", "--security-opt",
  "--add-host", "--network", "--network-alias", "--label", "-l", "--entrypoint",
  "--user", "-u", "--workdir", "-w", "--mount", "--platform", "--pull",
  "--cap-add", "--cap-drop", "--ulimit", "--shm-size", "--memory", "--cpus",
]);
const booleanFlags = new Set([
  "--rm", "-d", "--detach", "-i", "--interactive", "-t", "--tty", "-it",
  "--init", "--privileged", "--read-only", "--no-healthcheck",
]);

export function localhostPortArgs(input) {
  const args = [...input];
  const commandIndex = args[0] === "container" ? 1 : 0;
  if (!["create", "run"].includes(args[commandIndex])) return args;
  const ports = [];
  let network;
  for (let i = commandIndex + 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--" || !arg.startsWith("-")) break;
    const equal = arg.indexOf("=");
    const flag = equal < 0 ? arg : arg.slice(0, equal);
    if (booleanFlags.has(flag)) continue;
    assert.ok(valueFlags.has(flag), `Unsupported Docker flag in local adapter: ${flag}`);
    const index = equal < 0 ? ++i : i;
    const value = equal < 0 ? args[index] : arg.slice(equal + 1);
    assert.ok(value, "Missing Docker option value.");
    if (flag === "--network") network = value;
    if (flag === "-p" || flag === "--publish") ports.push({ index, value, prefix: equal < 0 ? "" : `${flag}=` });
  }
  if (network !== networkName) return args;
  for (const { index, value, prefix } of ports) {
    // Reject unexpected bindings rather than permit an externally reachable port.
    assert.match(value, /^(?:127\.0\.0\.1:)?\d+:\d+(?:\/(?:tcp|udp))?$/, "Unsupported local port mapping.");
    args[index] = prefix + (value.startsWith("127.0.0.1:") ? value : `127.0.0.1:${value}`);
  }
  return args;
}
