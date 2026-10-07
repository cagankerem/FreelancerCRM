import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";

const users = [randomUUID(), randomUUID()];
const literal = (value) => (value === null ? "null" : `'${String(value).replaceAll("'", "''")}'`);
function query(sql) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", [
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
    ]);
    let stdout = "",
      stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout: stdout.trim(), stderr }));
    child.stdin.end(`set statement_timeout='10s';\n${sql}`);
  });
}
async function sql(source) {
  const result = await query(source);
  assert.equal(result.code, 0, result.stderr);
  return result.stdout;
}
function owner(user, source, hold = false) {
  return `begin; set local role authenticated; select set_config('request.jwt.claims',${literal(JSON.stringify({ sub: user, role: "authenticated" }))},true); ${source}; ${hold ? "select pg_sleep(0.25);" : ""} commit;`;
}
function server(source, hold = false) {
  return `begin; set local role service_role; ${source}; ${hold ? "select pg_sleep(0.25);" : ""} commit;`;
}
async function create(user, currency = "EUR") {
  const output = await sql(
    owner(
      user,
      `select public.save_proposal(null,null,${literal(JSON.stringify({ client_name: "Synthetic customer", project_name: "Synthetic project", currency, tax_mode: "excluded" }))},null,
    '[{"description":"Synthetic service","quantity":"1","unit_price":"10.01","sort_order":0}]')`,
    ),
  );
  return JSON.parse(
    output
      .split("\n")
      .filter((x) => x.startsWith("{"))
      .at(-1),
  ).id;
}
async function state(id) {
  return JSON.parse(
    await sql(
      `select json_build_object('version',lock_version,'generation',share_generation,'decision',decision_status,'project',project_name,'mode',publication_mode,'lifecycle',lifecycle_status) from public.proposals where id=${literal(id)}`,
    ),
  );
}
function publish(user, id, version, pro = false, expires = "2099-01-01Z") {
  return `select public.publish_proposal(${literal(user)},${literal(id)},${version},${literal(randomUUID())},decode('${randomBytes(32).toString("hex")}','hex'),1,${literal(expires)},'${pro ? "live" : "locked"}',${pro ? 10 : "null"})`;
}
function respond(id, version, generation, kind) {
  return `select public.record_proposal_response(${literal(id)},${version},${generation},'${kind}',null,${literal(randomUUID())},'concurrency-fixture')`;
}
let passed = 0;
function ok(label) {
  passed++;
  console.log(`ok - ${label}`);
}

try {
  await sql(`begin; insert into auth.users(id,email) values(${literal(users[0])},${literal(`dbtest-${users[0]}@example.invalid`)}),(${literal(users[1])},${literal(`dbtest-${users[1]}@example.invalid`)});
    insert into public.profiles(id) values(${literal(users[0])}),(${literal(users[1])});
    insert into public.subscriptions(user_id,plan_code,status,current_period_end) values(${literal(users[1])},'pro','active','2099-01-01Z'); commit;`);
  const drafts = [];
  for (let i = 0; i < 4; i++) drafts.push(await create(users[0]));
  for (const id of drafts.slice(0, 2))
    await sql(server(publish(users[0], id, (await state(id)).version)));
  const slots = await Promise.all(
    drafts
      .slice(2)
      .map(async (id) => query(server(publish(users[0], id, (await state(id)).version), true))),
  );
  assert.equal(slots.filter((x) => x.code === 0).length, 1);
  assert.match(slots.find((x) => x.code !== 0).stderr, /active_proposal_limit/);
  assert.equal(
    await sql(
      `select count(*) from public.proposals where user_id=${literal(users[0])} and lifecycle_status='published'`,
    ),
    "3",
  );
  ok("two concurrent Free publications cannot occupy the same last slot");

  const initial = await state(drafts[0]);
  const decisions = await Promise.all(
    ["accepted", "rejected"].map((kind) =>
      query(server(respond(drafts[0], initial.version, initial.generation, kind), true)),
    ),
  );
  assert.equal(decisions.filter((x) => x.code === 0).length, 1);
  assert.match(decisions.find((x) => x.code !== 0).stderr, /decision_already_recorded/);
  assert.equal(
    await sql(
      `select count(*) from public.proposal_responses where proposal_id=${literal(drafts[0])}`,
    ),
    "1",
  );
  ok("concurrent accept/reject commits exactly one immutable decision");
  const remaining = drafts[2 + slots.findIndex((x) => x.code !== 0)];
  await sql(server(publish(users[0], remaining, (await state(remaining)).version)));
  ok("terminal response frees one active Free slot without deleting history");

  for (let i = 0; i < 3; i++) {
    const id = await create(users[1]);
    await sql(server(publish(users[1], id, (await state(id)).version, true)));
    const before = await state(id);
    const race = await Promise.all([
      query(
        owner(
          users[1],
          `select public.save_proposal(${literal(id)},${before.version},'{"project_name":"New conditions"}')`,
          true,
        ),
      ),
      query(server(respond(id, before.version, before.generation, "accepted"), true)),
    ]);
    assert.equal(race.filter((x) => x.code === 0).length, 1, JSON.stringify(race));
    const after = await state(id);
    if (race[0].code === 0) {
      assert.equal(after.decision, "pending");
      assert.equal(after.project, "New conditions");
      assert.match(race[1].stderr, /stale_content/);
    } else {
      assert.equal(after.decision, "accepted");
      assert.equal(after.project, "Synthetic project");
      assert.match(race[0].stderr, /content_locked/);
    }
  }
  ok("three edit/accept races never accept unseen changed content");

  const republished = await create(users[1]);
  await sql(server(publish(users[1], republished, (await state(republished)).version, true)));
  await sql(
    owner(
      users[1],
      `select public.proposal_action(${literal(republished)},${(await state(republished)).version},'locked')`,
    ),
  );
  const locked = await query(
    owner(
      users[1],
      `select public.save_proposal(${literal(republished)},${(await state(republished)).version},'{"project_name":"no"}')`,
    ),
  );
  assert.notEqual(locked.code, 0);
  assert.match(locked.stderr, /content_locked/);
  await sql(
    owner(
      users[1],
      `select public.proposal_action(${literal(republished)},${(await state(republished)).version},'live')`,
    ),
  );
  ok("Pro can lock and unlock pending content without bypassing its lock");
  const old = await state(republished);
  await sql(server(publish(users[1], republished, old.version, true, "2099-02-01Z")));
  const renewed = await state(republished);
  assert.equal(renewed.generation, old.generation + 1);
  const stale = await query(server(respond(republished, old.version, old.generation, "accepted")));
  assert.notEqual(stale.code, 0);
  assert.match(stale.stderr, /stale_content/);
  ok("Pro republish rotates generation and rejects old-link responses");
  await sql(
    owner(
      users[1],
      `select public.proposal_action(${literal(republished)},${renewed.version},'revoke')`,
    ),
  );
  await sql(
    server(publish(users[1], republished, (await state(republished)).version, true, "2099-03-01Z")),
  );
  assert.equal((await state(republished)).lifecycle, "published");
  ok("Pro can reactivate an unanswered revoked proposal");

  const freeRepublish = await query(
    server(publish(users[0], remaining, (await state(remaining)).version)),
  );
  assert.notEqual(freeRepublish.code, 0);
  assert.match(freeRepublish.stderr, /pro_required/);
  ok("Free cannot republish an existing publication through the server operation");

  await sql(`update public.subscriptions set status='expired' where user_id=${literal(users[1])}`);
  const denied = await query(
    owner(
      users[1],
      `select public.save_proposal(${literal(republished)},${(await state(republished)).version},'{"project_name":"forbidden"}')`,
    ),
  );
  assert.notEqual(denied.code, 0);
  assert.match(denied.stderr, /content_locked/);
  ok("expired Pro subscription cannot use a stale live-mode flag");
} finally {
  // Only UUIDs generated by this test invocation, never existing user records.
  await sql(`delete from auth.users where id in (${users.map(literal).join(",")})`);
  assert.equal(
    await sql(`select count(*) from auth.users where id in (${users.map(literal).join(",")})`),
    "0",
  );
  console.log("Concurrency fixture users and their dependent records removed.");
}
console.log(`Passed ${passed} concurrency/lifecycle checks.`);
