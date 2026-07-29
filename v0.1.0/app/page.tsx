import type { Metadata } from "next";

import { LandingPage } from "./landing-page";

export const metadata: Metadata = {
  title: "Hızlı teklif bağlantısı ve tek pencere yönetimi",
  description:
    "Freelance yazılımcılar ve UI/UX tasarımcıları için teklif oluşturma, bağlantıyla paylaşma ve yaklaşık görüntülenme takibi.",
};

export default function Home() {
  return <LandingPage />;
}
