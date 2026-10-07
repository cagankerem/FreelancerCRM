"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState } from "@/components/ui/error-state";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";

function UiStateFixture() {
  const [selected, setSelected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  return (
    <main className="min-h-dvh bg-background px-6 py-12 text-foreground">
      <div className="mx-auto grid w-full max-w-5xl gap-10">
        <header>
          <p className="text-sm font-semibold text-on-primary-container">Yalnız test amaçlı</p>
          <h1 className="mt-2 text-3xl font-semibold">Temel UI durumları</h1>
        </header>

        <section aria-labelledby="fixture-controls" className="grid gap-6">
          <h2 id="fixture-controls" className="text-xl font-semibold">
            Etkileşim durumları
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button>Birincil işlem</Button>
            <Button disabled>Devre dışı işlem</Button>
            <Button variant="destructive">Kaydı sil</Button>
          </div>

          <Field className="max-w-md">
            <FieldLabel htmlFor="fixture-normal-field">Normal alan</FieldLabel>
            <Input id="fixture-normal-field" />
          </Field>

          <Field className="max-w-md" data-invalid="true">
            <FieldLabel htmlFor="fixture-invalid-field">Hatalı alan</FieldLabel>
            <Input
              id="fixture-invalid-field"
              aria-invalid="true"
              aria-describedby="fixture-invalid-error"
            />
            <FieldError id="fixture-invalid-error">Geçerli bir değer gir.</FieldError>
          </Field>

          <div className="flex max-w-md items-start gap-3">
            <Checkbox
              id="fixture-selected-control"
              checked={selected}
              aria-describedby="fixture-selected-status"
              onCheckedChange={setSelected}
            />
            <div className="grid gap-1">
              <label htmlFor="fixture-selected-control" className="font-medium">
                Bildirim seçimi
              </label>
              <p
                id="fixture-selected-status"
                role="status"
                aria-live="polite"
                className="text-sm text-muted-foreground"
              >
                {selected ? "Bildirim seçildi" : "Bildirim seçilmedi"}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="fixture-route-states" className="grid gap-6 lg:grid-cols-2">
          <h2 id="fixture-route-states" className="sr-only">
            Rota durumları
          </h2>
          <LoadingState label="Test içeriği yükleniyor" />
          <div>
            <ErrorState
              title="İçerik yüklenemedi"
              description="Güvenli kullanıcı mesajı gösteriliyor."
              onRetry={() => setRetryCount((count) => count + 1)}
            />
            {retryCount > 0 ? (
              <p
                role="status"
                aria-live="polite"
                className="mt-3 text-center text-sm text-muted-foreground"
              >
                Tekrar denendi
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

export { UiStateFixture };
