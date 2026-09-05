"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  clearWaitlistSubmissions,
  saveWaitlistSubmission,
} from "@/lib/client/waitlist-storage";
import { waitlistFormSchema } from "@/lib/shared/schemas/waitlist";

const defaultValues = {
  email: "",
  persona: "",
  marketingConsent: false,
} satisfies z.input<typeof waitlistFormSchema>;

type SubmissionStatus = "idle" | "success" | "duplicate" | "storage-error";

type WaitlistFormProps = {
  price: number;
  onTrackEvent: (
    name: string,
    detail?: Record<string, string | number>,
  ) => void;
};

export function WaitlistForm({ price, onTrackEvent }: WaitlistFormProps) {
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const form = useForm<
    z.input<typeof waitlistFormSchema>,
    unknown,
    z.output<typeof waitlistFormSchema>
  >({
    defaultValues,
    resolver: zodResolver(waitlistFormSchema),
    shouldFocusError: true,
  });

  const clearFeedback = () => {
    if (status !== "idle") {
      setStatus("idle");
    }
  };

  const handleValidSubmit = (submission: z.output<typeof waitlistFormSchema>) => {
    const result = saveWaitlistSubmission(submission);

    if (result.status === "failure") {
      setStatus("storage-error");
      onTrackEvent("waitlist_submit_failed", { reason: "storage_unavailable" });
      return;
    }

    if (result.status === "duplicate") {
      setStatus("duplicate");
      onTrackEvent("waitlist_submit_duplicate", { price });
      return;
    }

    setStatus("success");
    onTrackEvent("waitlist_submit_succeeded", {
      price,
      persona: submission.persona ?? "belirtilmedi",
    });
    form.reset(defaultValues);
  };

  const handleInvalidSubmit = (
    errors: FieldErrors<z.input<typeof waitlistFormSchema>>,
  ) => {
    setStatus("idle");
    onTrackEvent("waitlist_submit_failed", {
      reason: errors.email ? "invalid_email" : "invalid_form",
    });
  };

  const handleClearRegistration = () => {
    const result = clearWaitlistSubmissions();
    if (result.status === "failure") {
      setStatus("storage-error");
      return;
    }

    setStatus("idle");
    onTrackEvent("waitlist_local_registration_cleared");
  };

  const feedbackRole =
    status === "storage-error"
      ? "alert"
      : status === "success" || status === "duplicate"
        ? "status"
        : undefined;

  return (
    <form
      aria-labelledby="waitlist-heading"
      noValidate
      onSubmit={form.handleSubmit(handleValidSubmit, handleInvalidSubmit)}
    >
      <FieldGroup className="lp-form-group">
        <div className="lp-form-row">
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field className="lp-field" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="waitlist-email">
                  E-posta adresin <b aria-hidden="true">*</b>
                </FieldLabel>
                <span className="lp-input-wrap">
                  <Mail aria-hidden="true" />
                  <Input
                    {...field}
                    id="waitlist-email"
                    type="email"
                    autoComplete="email"
                    placeholder="ornek@eposta.com"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={
                      fieldState.invalid ? "waitlist-email-error" : undefined
                    }
                    onChange={(event) => {
                      field.onChange(event);
                      clearFeedback();
                    }}
                  />
                </span>
                <FieldError
                  id="waitlist-email-error"
                  errors={[fieldState.error]}
                />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="persona"
            render={({ field, fieldState }) => (
              <Field className="lp-field" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="waitlist-persona">
                  Sen kimsin? <small>(isteğe bağlı)</small>
                </FieldLabel>
                <NativeSelect
                  {...field}
                  id="waitlist-persona"
                  className="lp-native-select"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid ? "waitlist-persona-error" : undefined
                  }
                  onChange={(event) => {
                    field.onChange(event);
                    clearFeedback();
                  }}
                >
                  <NativeSelectOption value="">Seçiniz</NativeSelectOption>
                  <NativeSelectOption value="developer">
                    Freelance yazılımcı
                  </NativeSelectOption>
                  <NativeSelectOption value="designer">
                    UI/UX tasarımcısı
                  </NativeSelectOption>
                </NativeSelect>
                <FieldError
                  id="waitlist-persona-error"
                  errors={[fieldState.error]}
                />
              </Field>
            )}
          />
        </div>

        <div
          className="lp-disclosure"
          id="aydinlatma"
          role="note"
          aria-labelledby="aydinlatma-baslik"
        >
          <strong id="aydinlatma-baslik">Aydınlatma ve gizlilik özeti</strong>
          <p>
            E-posta adresi, isteğe bağlı persona ve iletişim tercihi yalnızca bu
            cihazda saklanır; sunucuya gönderilmez. Kalıcı bekleme listesi devreye
            alınmadan önce veri sorumlusu, saklama süresi ve iletişim kanalı ayrıca
            açıklanacaktır.
          </p>
        </div>

        <Controller
          control={form.control}
          name="marketingConsent"
          render={({ field, fieldState }) => {
            const { ref, value, onChange, ...checkboxField } = field;

            return (
              <Field
                orientation="horizontal"
                className="lp-consent-field"
                data-invalid={fieldState.invalid}
              >
                <Checkbox
                  {...checkboxField}
                  id="waitlist-consent"
                  checked={value}
                  inputRef={ref}
                  aria-invalid={fieldState.invalid}
                  aria-labelledby="waitlist-consent-label"
                  aria-describedby={
                    fieldState.invalid ? "waitlist-consent-error" : undefined
                  }
                  onCheckedChange={(isChecked) => {
                    onChange(isChecked);
                    clearFeedback();
                  }}
                />
                <FieldContent>
                  <FieldLabel
                    className="lp-consent"
                    htmlFor="waitlist-consent"
                    id="waitlist-consent-label"
                  >
                    İsteğe bağlı: Alpha süreci dışındaki ürün duyurularını da almak
                    istiyorum.
                  </FieldLabel>
                  <FieldError
                    id="waitlist-consent-error"
                    errors={[fieldState.error]}
                  />
                </FieldContent>
              </Field>
            );
          }}
        />
      </FieldGroup>

      <Button className="lp-form-submit" size="lg" type="submit">
        Alpha sürümüne katıl <ArrowRight data-icon="inline-end" />
      </Button>
      <div
        className="lp-form-message"
        role={feedbackRole}
        aria-live={feedbackRole === "status" ? "polite" : undefined}
      >
        {status === "success" ? (
          <span className="is-success">
            <CheckCircle2 />Demo kaydın bu cihazda saklandı. Bu, gerçek bir erken
            erişim başvurusu değildir.
          </span>
        ) : null}
        {status === "duplicate" ? (
          <span className="is-info">
            <Mail />Bu e-posta bu cihazdaki demo kayıtlarda zaten bulunuyor.
          </span>
        ) : null}
        {status === "storage-error" ? (
          <span className="is-error">
            Kayıt bu tarayıcıda saklanamadı. Lütfen daha sonra tekrar dene.
          </span>
        ) : null}
        {status === "idle" ? (
          <span>
            <ShieldCheck />Kart bilgisi istenmez. Verilerin minimum düzeyde tutulur.
          </span>
        ) : null}
      </div>
      {status === "success" || status === "duplicate" ? (
        <Button
          className="lp-clear-registration"
          variant="link"
          size="sm"
          type="button"
          onClick={handleClearRegistration}
        >
          Bu cihazdaki demo kaydını sil
        </Button>
      ) : null}
    </form>
  );
}
