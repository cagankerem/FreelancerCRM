import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { headers } from "next/headers";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: "variable",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: "variable",
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const socialImage = `${protocol}://${host}/og.png`;

  return {
    title: {
      default: "Kapsam",
      template: "%s · Kapsam",
    },
    description: "Freelancerlar için profesyonel teklif oluşturma ve yaklaşık görüntülenme takibi.",
    openGraph: {
      title: "Kapsam — Tekliflerini oluştur, paylaş ve takip et",
      description: "Freelancerlar için AI destekli teklif oluşturma ve takip deneyimi.",
      images: [{ url: socialImage, width: 1200, height: 630, alt: "Kapsam ürün arayüzü" }],
      type: "website",
      locale: "tr_TR",
    },
    twitter: {
      card: "summary_large_image",
      title: "Kapsam — Tekliflerini oluştur, paylaş ve takip et",
      description: "Freelancerlar için AI destekli teklif oluşturma ve takip deneyimi.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${manrope.variable} ${sora.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
