import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Kapsam",
    template: "%s · Kapsam",
  },
  description:
    "Freelancerlar için profesyonel teklif oluşturma ve yaklaşık görüntülenme takibi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={geistSans.variable + " " + geistMono.variable}>{children}</body>
    </html>
  );
}
