import type { Metadata } from "next";
import { PrototypeApp } from "./prototype-app";

export const metadata: Metadata = {
  title: "Kapsam — Freelancer teklif deneyimi",
  description:
    "Freelancerlar için AI destekli teklif oluşturma, paylaşma ve yaklaşık görüntülenme takibi prototipi.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function Home() {
  return <PrototypeApp />;
}
