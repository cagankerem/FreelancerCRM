// Requires explicit human email consent; never creates/deletes an account or changes its password.
process.env.AUTH_TEST_FLOW = "preview-magiclink";
await import("./test-staging-email-auth.mjs");
