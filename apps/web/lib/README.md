# Runtime boundaries

The application uses three explicit library layers:

- `server/` contains authentication, secrets, database access, and server SDK adapters. Every TypeScript entry module starts with `import "server-only";`.
- `client/` contains browser APIs and browser-only helpers. It must not import or transitively reach `server/`.
- `shared/` contains plain types and pure helpers. It must not depend on React, Next.js, runtime environment variables, `server/`, or `client/`.

Outside `server/`, code may read only explicitly public `NEXT_PUBLIC_*` environment variables. Server modules must be imported directly and cannot be re-exported from another layer.

Server Components are the default. Add `"use client"` only to interactive leaf components. A Client Component and everything reachable from its local import graph must stay outside `lib/server/`.

Import server modules directly from their source files. Do not create barrel files that re-export server code into client or shared entry points.

These rules are enforced by `tests/server-boundary.test.mjs`. Supabase clients and their runtime placement belong to TASK-003.
