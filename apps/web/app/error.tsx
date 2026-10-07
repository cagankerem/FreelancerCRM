"use client";

import { ErrorState } from "@/components/ui/error-state";

type AppErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function AppError({ retry }: AppErrorProps) {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 py-16 text-foreground">
      <ErrorState headingLevel="h1" onRetry={retry} />
    </main>
  );
}
