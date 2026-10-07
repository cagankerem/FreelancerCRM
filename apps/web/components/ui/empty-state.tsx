import type { ReactNode } from "react";

import { cn } from "@/lib/shared/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
  headingLevel?: "h1" | "h2" | "h3";
  className?: string;
};

function EmptyState({
  title,
  description,
  icon,
  action,
  headingLevel = "h2",
  className,
}: EmptyStateProps) {
  const Heading = headingLevel;

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center rounded-[18px] border border-border bg-card p-8 text-center text-card-foreground shadow-sm",
        className,
      )}
    >
      <div
        aria-hidden="true"
        data-slot="empty-state-icon"
        className="grid size-12 place-items-center rounded-[14px] bg-muted text-muted-foreground [&_svg]:size-6"
      >
        {icon}
      </div>
      <Heading className="mt-5 text-lg font-semibold text-balance">{title}</Heading>
      <p className="mt-2 text-sm leading-6 text-muted-foreground text-pretty">{description}</p>
      {action ? (
        <div data-slot="empty-state-action" className="mt-6">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
