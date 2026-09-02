"use client"

import { TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/shared/utils"

type ErrorStateProps = {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  headingLevel?: "h1" | "h2" | "h3"
  className?: string
}

function ErrorState({
  title = "Bir şeyler ters gitti",
  description = "İçerik şu anda yüklenemiyor. Lütfen kısa bir süre sonra tekrar deneyin.",
  onRetry,
  retryLabel = "Tekrar dene",
  headingLevel = "h2",
  className,
}: ErrorStateProps) {
  const Heading = headingLevel

  return (
    <div
      role="alert"
      data-slot="error-state"
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center rounded-[18px] border border-border bg-card p-8 text-center text-card-foreground shadow-sm",
        className
      )}
    >
      <div
        aria-hidden="true"
        data-slot="error-state-icon"
        className="grid size-12 place-items-center rounded-[14px] bg-destructive/10 text-destructive"
      >
        <TriangleAlert className="size-6" />
      </div>
      <Heading className="mt-5 text-lg font-semibold text-balance">{title}</Heading>
      <p className="mt-2 text-sm leading-6 text-muted-foreground text-pretty">
        {description}
      </p>
      {onRetry ? (
        <Button className="mt-6 px-5" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}

export { ErrorState }
export type { ErrorStateProps }
