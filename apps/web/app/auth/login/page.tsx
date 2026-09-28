import type { Metadata } from "next";
import Link from "next/link";
import { login } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Giriş", robots: { index: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="product-shell product-narrow"><h1>Giriş yap</h1><p>Teklif çalışma alanına devam et.</p>
    {error && <p role="alert">E-posta veya parola doğrulanamadı.</p>}
    <form action={login} className="product-form">
      <label>E-posta<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label>Parola<input name="password" type="password" autoComplete="current-password" required /></label>
      <button type="submit">Giriş yap</button>
    </form><p>Hesabın yok mu? <Link href="/auth/register">Kayıt ol</Link></p></main>;
}
