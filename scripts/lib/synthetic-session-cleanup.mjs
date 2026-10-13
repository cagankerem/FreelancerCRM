import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(new URL("../../apps/web/package.json", import.meta.url));
const { isAuthSessionMissingError } = require("@supabase/supabase-js");

export async function revokeSyntheticSession(admin, token) {
  const { error } = await admin.signOut(token, "global");
  // The smoke flow already logs out. Only an explicitly absent session is idempotent.
  assert.ok(
    !error || error.code === "session_not_found" || isAuthSessionMissingError(error),
    "Synthetic session revocation failed; refusing account deletion",
  );
}
