import { LoadingState } from "@/components/ui/loading-state"

export default function Loading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 py-16 text-foreground">
      <LoadingState label="Sayfa hazırlanıyor" />
    </main>
  )
}
