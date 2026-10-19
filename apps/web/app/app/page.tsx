import Link from "next/link";
import { requireUser } from "@/lib/server/auth";
import { renderOperation } from "@/lib/server/render-operation";
import { providerError } from "@/lib/server/observability";

export default async function DashboardPage() {
  return renderOperation("dashboard.read", async () => {
    const { id, db } = await requireUser();
    const [profile, clients, proposals] = await Promise.all([
      db.from("profiles").select("full_name").eq("id", id).single(),
      db.from("clients").select("id", { count: "exact", head: true }),
      db.from("proposals").select("id", { count: "exact", head: true }),
    ]);
    if (profile.error || clients.error || proposals.error)
      throw providerError(profile.error ?? clients.error ?? proposals.error);
    return (
      <section>
        <h1>Merhaba, {profile.data?.full_name ?? "freelancer"}</h1>
        <p>Çalışma alanındaki gerçek veriler.</p>
        <div className="product-grid">
          <article>
            <h2>Müşteriler</h2>
            <p>{clients.count ?? 0}</p>
            <Link href="/app/clients">Müşterileri aç</Link>
          </article>
          <article>
            <h2>Teklifler</h2>
            <p>{proposals.count ?? 0}</p>
            <Link href="/app/proposals">Teklifleri aç</Link>
          </article>
        </div>
      </section>
    );
  });
}
