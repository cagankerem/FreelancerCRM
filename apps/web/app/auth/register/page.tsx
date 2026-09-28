import type { Metadata } from "next";
import Link from "next/link";
import { register } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Kayıt", robots: { index: false } };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="product-shell product-narrow"><h1>Hesap oluştur</h1><p>İlk teklifini hazırlamaya başla.</p>
    {error && <p role="alert">Kayıt tamamlanamadı. Bilgilerini kontrol edip yeniden dene.</p>}
    <form action={register} className="product-form">
      <label>E-posta<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label>Parola <small>En az 8 karakter, harf ve rakam.</small><input name="password" type="password" autoComplete="new-password" required minLength={8} /></label>
      <button type="submit">Kayıt ol</button>
    </form><p>Zaten hesabın var mı? <Link href="/auth/login">Giriş yap</Link></p></main>;
}
