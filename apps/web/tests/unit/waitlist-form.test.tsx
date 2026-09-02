import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { WAITLIST_STORAGE_KEY } from "@/lib/client/waitlist-storage";

function renderWaitlistForm(onTrackEvent = vi.fn()) {
  render(
    <>
      <h2 id="waitlist-heading">Alpha sürümüne katıl</h2>
      <WaitlistForm price={149} onTrackEvent={onTrackEvent} />
    </>,
  );
}

describe("WaitlistForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("links validation feedback and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    renderWaitlistForm();

    const form = screen.getByRole("form", { name: "Alpha sürümüne katıl" });
    await user.click(
      within(form).getByRole("button", { name: "Alpha sürümüne katıl" }),
    );

    const email = screen.getByRole("textbox", { name: /e-posta adresin/i });
    const error = await screen.findByRole("alert");

    expect(error).toHaveTextContent("E-posta adresini gir.");
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute("aria-describedby", error.id);
    expect(email.closest('[data-slot="field"]')).toHaveAttribute(
      "data-invalid",
      "true",
    );
    expect(window.localStorage.getItem(WAITLIST_STORAGE_KEY)).toBeNull();
  });

  it("clears email error semantics after the value becomes valid", async () => {
    const user = userEvent.setup();
    renderWaitlistForm();

    const email = screen.getByRole("textbox", { name: /e-posta adresin/i });
    await user.type(email, "gecersiz");
    await user.click(
      screen.getByRole("button", { name: "Alpha sürümüne katıl" }),
    );

    expect(
      await screen.findByText("Geçerli bir e-posta adresi gir."),
    ).toBeVisible();

    await user.clear(email);
    await user.type(email, "user@example.com");

    await waitFor(() => {
      expect(email).toHaveAttribute("aria-invalid", "false");
      expect(email).not.toHaveAttribute("aria-describedby");
      expect(email.closest('[data-slot="field"]')).toHaveAttribute(
        "data-invalid",
        "false",
      );
    });
  });

  it("stores normalized values and resets every controlled field", async () => {
    const user = userEvent.setup();
    renderWaitlistForm();

    const email = screen.getByRole("textbox", { name: /e-posta adresin/i });
    const persona = screen.getByRole("combobox", { name: /sen kimsin/i });
    const consent = screen.getByRole("checkbox", {
      name: /ürün duyurularını da almak istiyorum/i,
    });

    await user.type(email, "  USER@Example.COM  ");
    await user.selectOptions(persona, "designer");
    await user.click(consent);
    await user.click(
      screen.getByRole("button", { name: "Alpha sürümüne katıl" }),
    );

    const successMessage = await screen.findByText(
      /demo kaydın bu cihazda saklandı/i,
    );
    expect(successMessage).toBeVisible();
    expect(successMessage.closest('[aria-live="polite"]')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(WAITLIST_STORAGE_KEY) ?? "null")).toEqual([
      {
        email: "user@example.com",
        persona: "designer",
        marketingConsent: true,
      },
    ]);
    await waitFor(() => {
      expect(email).toHaveValue("");
      expect(persona).toHaveValue("");
      expect(consent).not.toBeChecked();
    });
  });

  it("shows a stable message without leaking storage exception details", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SECRET quota implementation detail");
    });
    renderWaitlistForm();

    await user.type(
      screen.getByRole("textbox", { name: /e-posta adresin/i }),
      "user@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: "Alpha sürümüne katıl" }),
    );

    const errorMessage = await screen.findByText(
      "Kayıt bu tarayıcıda saklanamadı. Lütfen daha sonra tekrar dene.",
    );
    expect(errorMessage).toBeVisible();
    expect(errorMessage.closest('[aria-live="polite"]')).toBeInTheDocument();
    expect(screen.queryByText(/secret quota/i)).not.toBeInTheDocument();
  });
});
