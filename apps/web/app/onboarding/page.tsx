import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { saveProfile } from "@/app/onboarding/actions";

export const metadata: Metadata = { title: "Profil başlangıcı", robots: { index: false } };
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }] = await Promise.all([searchParams, requireUser()]);
  return (
    <main className="product-shell product-narrow">
      <h1>Profilini tamamla</h1>
      <p>Tekliflerde görünecek adını ve mesleğini belirle.</p>
      {error && <p role="alert">Profil kaydedilemedi. Alanları kontrol edip tekrar dene.</p>}
      <form action={saveProfile} className="product-form">
        <label>
          Ad ve soyad
          <input name="full_name" autoComplete="name" required maxLength={200} />
        </label>
        <label>
          Meslek
          <input name="profession" required maxLength={120} />
        </label>
        <label>
          Teklif para birimi
          <select name="default_currency" required defaultValue="">
            <option value="" disabled>
              Seç
            </option>
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
        <button type="submit">Çalışma alanına geç</button>
      </form>
    </main>
  );
}
