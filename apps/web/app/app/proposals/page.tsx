import Link from "next/link";
import { requireUser } from "@/lib/server/auth";

export default async function ProposalsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: inputError } = await searchParams;
  const { db } = await requireUser();
  const { data, error } = await db.from("proposals").select("id,project_name,client_name,lifecycle_status,currency,total_amount").order("created_at", { ascending: false });
  return <section><h1>Teklifler</h1>{inputError && <p role="alert">İşlem tamamlanamadı.</p>}<p><Link href="/app/proposals/new">Yeni teklif oluştur</Link></p>
    {error && <p role="alert">Teklifler yüklenemedi.</p>}
    <ul className="product-list">{data?.map((proposal) => <li key={proposal.id}><Link href={`/app/proposals/${proposal.id}`}>{proposal.project_name ?? "Adsız teklif"}</Link>
      <span>{proposal.client_name} · {proposal.lifecycle_status} · {proposal.total_amount} {proposal.currency}</span></li>)}</ul>
    {!data?.length && !error && <p>Henüz teklif yok.</p>}</section>;
}
