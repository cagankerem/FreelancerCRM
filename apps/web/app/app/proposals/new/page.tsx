import Link from "next/link";
import { createDraft } from "@/app/app/proposals/new/actions";
import { requireUser } from "@/lib/server/auth";

export default async function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, { id, db }] = await Promise.all([searchParams, requireUser()]);
  const [clients, profile] = await Promise.all([
    db.from("clients").select("id,name,company_name").order("name"),
    db.from("profiles").select("default_currency").eq("id", id).single(),
  ]);
  return (
    <section>
      <h1>Yeni taslak teklif</h1>
      <p>Teklif taslak olarak kaydedilir; yayına alınana kadar müşteriye açık değildir.</p>
      {error && <p role="alert">Teklif kaydedilemedi. Alanları kontrol et ve tekrar dene.</p>}
      {!clients.data?.length ? (
        <p>
          Önce bir <Link href="/app/clients">müşteri ekle</Link>.
        </p>
      ) : (
        <form action={createDraft} className="product-form product-narrow">
          <label>
            Müşteri
            <select name="client_id" required defaultValue="">
              <option value="" disabled>
                Seç
              </option>
              {clients.data.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                  {client.company_name ? ` · ${client.company_name}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Proje adı
            <input name="project_name" required maxLength={200} />
          </label>
          <label>
            Para birimi
            <select name="currency" defaultValue={profile.data?.default_currency ?? ""} required>
              <option value="" disabled>
                Seç
              </option>
              <option>TRY</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </label>
          <label>
            Vergi gösterimi
            <select name="tax_mode" defaultValue="" required>
              <option value="" disabled>
                Seç
              </option>
              <option value="included">Vergi dahil</option>
              <option value="excluded">Vergi hariç</option>
            </select>
          </label>
          <label>
            Hizmet kalemi
            <input name="description" required maxLength={2000} />
          </label>
          <div className="product-grid">
            <label>
              Adet
              <input name="quantity" inputMode="decimal" required placeholder="1" />
            </label>
            <label>
              Birim fiyat
              <input name="unit_price" inputMode="decimal" required placeholder="0.00" />
            </label>
          </div>
          <button type="submit">Taslağı kaydet</button>
        </form>
      )}
    </section>
  );
}
