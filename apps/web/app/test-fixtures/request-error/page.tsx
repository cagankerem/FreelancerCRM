import { notFound } from "next/navigation";
import { connection } from "next/server";
import { RequestErrorFixture } from "@/components/testing/request-error-fixture";
import { publicSupabaseSettings } from "@/lib/server/supabase";
import { controlledError } from "./actions";
import { headers } from "next/headers";
import { renderOperation } from "@/lib/server/render-operation";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ render?: string }>;
}) {
  await connection();
  if (!["local", "ci"].includes(publicSupabaseSettings().environment)) notFound();
  return renderOperation("diagnostic", async () => {
    if ((await searchParams).render === "failure")
      throw new Error(
        (await headers()).get("x-diagnostic-canary") ?? "Controlled synthetic failure",
      );
    return <RequestErrorFixture submit={controlledError} />;
  });
}
