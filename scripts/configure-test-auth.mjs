import assert from "node:assert/strict";
import { stagingOrigin, testManagement } from "./lib/supabase-management.mjs";

const before = await testManagement("/config/auth");
const settings = { site_url: stagingOrigin, uri_allow_list: `${stagingOrigin}/auth/callback` };
if (before.site_url !== settings.site_url || before.uri_allow_list !== settings.uri_allow_list)
  await testManagement("/config/auth", { method: "PATCH", body: settings });
const after = await testManagement("/config/auth");
assert.equal(after.site_url, settings.site_url);
assert.equal(after.uri_allow_list, settings.uri_allow_list);
assert.equal(
  after.mailer_autoconfirm,
  before.mailer_autoconfirm,
  "Email confirmation setting changed unexpectedly.",
);
console.log(
  "Test Auth exact staging Site URL/callback verified; email confirmation unchanged. Production untouched.",
);
