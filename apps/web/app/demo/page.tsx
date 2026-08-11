import type { Metadata } from "next";

import { DemoApp } from "@/components/demo/demo-app";

export const metadata: Metadata = {
  title: "Ürün demosu",
  description: "Kapsam’ın temel teklif akışlarını örnek verilerle keşfedebileceğin ürün tanıtım deneyimi.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DemoPage() {
  return <DemoApp />;
}
