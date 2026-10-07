import { Circle } from "lucide-react";
import { isInaccessible } from "@testing-library/dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

describe("LoadingState", () => {
  it("announces its default loading status without exposing decorative skeletons", () => {
    render(<LoadingState />);

    const status = screen.getByRole("status");

    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("İçerik yükleniyor");
    expect(within(status).queryAllByRole("progressbar")).toHaveLength(0);
  });

  it("supports a context-specific accessible label", () => {
    render(<LoadingState label="Teklifler hazırlanıyor" />);

    expect(screen.getByRole("status")).toHaveTextContent("Teklifler hazırlanıyor");
  });
});

describe("EmptyState", () => {
  it("renders its content without inventing an action", () => {
    render(
      <EmptyState
        icon={<Circle aria-label="Dekoratif daire" />}
        title="Henüz teklif yok"
        description="İlk teklifini oluşturarak başlayabilirsin."
      />,
    );

    expect(screen.getByRole("heading", { name: "Henüz teklif yok" })).toBeVisible();
    expect(screen.getByText("İlk teklifini oluşturarak başlayabilirsin.")).toBeVisible();
    expect(isInaccessible(screen.getByLabelText("Dekoratif daire"))).toBe(true);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("runs an optional action", async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();

    render(
      <EmptyState
        icon={<Circle />}
        title="Henüz müşteri yok"
        description="İlk müşterini ekleyebilirsin."
        action={<button onClick={handleAction}>Müşteri ekle</button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Müşteri ekle" }));

    expect(handleAction).toHaveBeenCalledOnce();
  });
});

describe("ErrorState", () => {
  it("renders only stable user-facing defaults when retry is unavailable", () => {
    render(<ErrorState />);

    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent("Bir şeyler ters gitti");
    expect(alert).toHaveTextContent(
      "İçerik şu anda yüklenemiyor. Lütfen kısa bir süre sonra tekrar deneyin.",
    );
    expect(within(alert).queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls its optional retry action exactly once", async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();
    render(<ErrorState onRetry={handleRetry} />);

    await user.click(screen.getByRole("button", { name: "Tekrar dene" }));

    expect(handleRetry).toHaveBeenCalledOnce();
  });
});
