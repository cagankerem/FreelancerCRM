import Link from "next/link";
import { createClient } from "@/app/app/clients/actions";
import { requireUser } from "@/lib/server/auth";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, { db }] = await Promise.all([searchParams, requireUser()]);
  const result = await db.from("clients").select("id,name,company_name").order("created_at", { ascending: false });
  return <section><h1>Müşteriler</h1><p>Teklifte kullanacağın müşteri bilgilerini burada tut.</p>
    {error && <p role="alert">Müşteri kaydedilemedi. Bilgileri kontrol et.</p>}
    <form action={createClient} className="product-form product-narrow"><label>Müşteri adı<input name="name" required maxLength={200} /></label>
      <label>Şirket <small>isteğe bağlı</small><input name="company_name" maxLength={200} /></label><button type="submit">Müşteri ekle</button></form>
    <h2>Kayıtlı müşteriler</h2>{result.error && <p role="alert">Müşteriler yüklenemedi.</p>}
    <ul className="product-list">{result.data?.map((client) => <li key={client.id}>{client.name}{client.company_name ? ` · ${client.company_name}` : ""}</li>)}</ul>
    {!result.data?.length && !result.error && <p>Henüz müşteri eklenmedi.</p>}
    <Link href="/app/proposals/new">Teklif oluştur</Link></section>;
}
