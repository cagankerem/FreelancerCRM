import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/shared/utils"

type LoadingStateProps = {
  label?: string
  className?: string
}

function LoadingState({
  label = "İçerik yükleniyor",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      data-slot="loading-state"
      className={cn(
        "mx-auto flex w-full max-w-md flex-col rounded-[18px] border border-border bg-card p-8 text-card-foreground shadow-sm",
        className
      )}
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-4">
        <Skeleton className="h-5 w-2/5" />
        <div className="space-y-2.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      </div>
    </div>
  )
}

export { LoadingState }
export type { LoadingStateProps }
