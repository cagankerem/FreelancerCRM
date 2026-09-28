import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { ownerShareLink } from "@/lib/server/share";
import { publishProposal } from "@/app/app/proposals/[proposalId]/actions";

export default async function ProposalPage({ params, searchParams }: { params: Promise<{ proposalId: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ proposalId }, { error }, { db, id }] = await Promise.all([params, searchParams, requireUser()]);
  const [proposal, items, sections] = await Promise.all([
    db.from("proposals").select("id,project_name,client_name,client_company,currency,total_amount,tax_mode,lifecycle_status,decision_status,lock_version").eq("id", proposalId).maybeSingle(),
    db.from("proposal_items").select("id,description,quantity,unit_label,unit_price,line_total").eq("proposal_id", proposalId).order("sort_order"),
    db.from("proposal_sections").select("id,title,content").eq("proposal_id", proposalId).order("sort_order"),
  ]);
  if (!proposal.data) notFound();
  const data = proposal.data;
  const shareLink = data.lifecycle_status === "published" ? await ownerShareLink(data.id, id) : null;
  return <article><p><Link href="/app/proposals">← Teklifler</Link></p><h1>{data.project_name}</h1>
    {error && <p role="alert">Teklif yayınlanamadı. Gerekli alanları, tarihi ve aktif teklif hakkını kontrol et.</p>}
    <p>{data.client_name}{data.client_company ? ` · ${data.client_company}` : ""}</p>
    <p>Durum: {data.lifecycle_status} · Yanıt: {data.decision_status}</p>
    <h2>Hizmetler</h2><ul className="product-list">{items.data?.map((item) => <li key={item.id}>{item.description} · {item.quantity} × {item.unit_price} = {item.line_total} {data.currency}</li>)}</ul>
    {sections.data?.map((section) => <section key={section.id}><h2>{section.title}</h2><p>{section.content}</p></section>)}
    <p><strong>Toplam: {data.total_amount} {data.currency}</strong> · Vergi {data.tax_mode === "included" ? "dahil" : "hariç"}</p>
    {data.lifecycle_status === "draft" && <form action={publishProposal} className="product-form product-narrow"><input type="hidden" name="proposalId" value={data.id} />
      <label>Bağlantının geçerli olacağı son gün (UTC)<input name="validDate" type="date" required /></label>
      <button type="submit">Teklifi yayınla</button></form>}
    {shareLink && <p>Paylaşım bağlantısı: <a href={shareLink}>{shareLink}</a></p>}
    <p>Fatura yerine geçmez.</p></article>;
}
