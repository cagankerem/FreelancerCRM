"use client";

import { useState } from "react";
import { ErrorState } from "@/components/ui/error-state";

type Result = { data: null; error: { code: string; message: string }; requestId: string } | null;
export function RequestErrorFixture({ submit }: { submit: (form: FormData) => Promise<Result> }) {
  const [result, setResult] = useState<Result>(null);
  return (
    <main>
      <form action={async (form) => setResult(await submit(form))}>
        <input type="hidden" name="privateCanary" defaultValue="" />
        <button type="submit">Kontrollü hata</button>
      </form>
      {result ? (
        <ErrorState description={result.error.message} requestId={result.requestId} />
      ) : null}
    </main>
  );
}
