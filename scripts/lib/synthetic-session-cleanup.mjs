import assert from "node:assert/strict";

export async function revokeSyntheticSession(admin, token) {
  const { error } = await admin.signOut(token, "global");
  // The smoke flow already logs out. Only an explicitly absent session is idempotent.
  assert.ok(
    !error || error.code === "session_not_found",
    "Synthetic session revocation failed; refusing account deletion",
  );
}
