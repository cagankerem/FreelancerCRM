import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { requireUser } from "@/lib/server/auth";

export const metadata: Metadata = { robots: { index: false } };
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { id, db } = await requireUser();
  const { data: profile, error } = await db
    .from("profiles")
    .select("full_name,onboarding_completed_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Profile lookup failed: ${error.code}`);
  if (!profile?.onboarding_completed_at) redirect("/onboarding");
  return (
    <div className="product-shell">
      <header className="product-header">
        <Link href="/app" className="product-logo">
          Kapsam
        </Link>
        <nav aria-label="Uygulama">
          <Link href="/app">Genel bakış</Link>
          <Link href="/app/clients">Müşteriler</Link>
          <Link href="/app/proposals/new">Yeni teklif</Link>
        </nav>
        <form action={logout}>
          <button type="submit">Çıkış</button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  );
}
