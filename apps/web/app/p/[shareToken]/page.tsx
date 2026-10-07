import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicProposal } from "@/lib/server/share";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Teklif",
  robots: { index: false, follow: false, nocache: true, noimageindex: true },
};

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const proposal = await publicProposal(shareToken);
  if (!proposal) notFound();
  return (
    <main className="product-shell product-narrow">
      <h1>{proposal.projectName}</h1>
      <p>
        Teklif: {proposal.clientName}
        {proposal.clientCompany ? ` · ${proposal.clientCompany}` : ""}
      </p>
      {proposal.validUntil && (
        <p>
          Geçerlilik:{" "}
          {new Date(proposal.validUntil).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
        </p>
      )}
      <p>Yanıt durumu: {proposal.decisionStatus}</p>
      {proposal.sections.map((section, index) => (
        <section key={`${section.title}-${index}`}>
          <h2>{section.title}</h2>
          <p>{section.content}</p>
        </section>
      ))}
      <h2>Hizmet kalemleri</h2>
      <ul className="product-list">
        {proposal.items.map((item, index) => (
          <li key={index}>
            {item.description} · {item.quantity} × {item.unit_price} = {item.line_total}{" "}
            {proposal.currency}
          </li>
        ))}
      </ul>
      <p>
        <strong>
          Toplam: {proposal.totalAmount} {proposal.currency}
        </strong>{" "}
        · Vergi {proposal.taxMode === "included" ? "dahil" : "hariç"}
      </p>
      <p>Fatura yerine geçmez.</p>
    </main>
  );
}
