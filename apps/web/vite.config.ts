import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { supabaseProjects } from "./lib/shared/supabase-projects";

export default defineConfig({
  envDir: ["staging", "preview"].includes(process.env.WORKERS_TARGET ?? "") ? false : undefined,
  plugins: [
    {
      name: "supabase-project-build-isolation",
      enforce: "pre",
      transform(_code, id) {
        if (
          !["staging", "preview"].includes(process.env.WORKERS_TARGET ?? "") ||
          !id.endsWith("/lib/shared/supabase-projects.ts")
        )
          return;
        return `export const supabaseProjects = ${JSON.stringify({ test: supabaseProjects.test })};`;
      },
    },
    vinext(),
    cloudflare({ viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } }),
  ],
});
