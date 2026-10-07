import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 py-16 text-foreground">
      <EmptyState
        headingLevel="h1"
        icon={<FileQuestion />}
        title="Sayfa bulunamadı"
        description="Aradığın sayfa kaldırılmış, taşınmış veya adresi yanlış yazılmış olabilir."
        action={
          <Link
            href="/"
            className={buttonVariants({
              size: "lg",
              className: "h-[42px] px-5",
            })}
          >
            Ana sayfaya dön
          </Link>
        }
      />
    </main>
  );
}
