import type { Metadata } from "next"

import { UiStateFixture } from "@/components/testing/ui-state-fixture"

export const metadata: Metadata = {
  title: "UI durum testi",
  robots: {
    follow: false,
    index: false,
  },
}

export default function UiStatesPage() {
  return <UiStateFixture />
}
