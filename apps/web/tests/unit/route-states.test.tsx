import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AppError from "@/app/error";
import Loading from "@/app/loading";
import NotFound from "@/app/not-found";

describe("App Router state boundaries", () => {
  it("renders a named loading status inside the main landmark", () => {
    render(<Loading />);

    expect(screen.getByRole("main")).toContainElement(screen.getByRole("status"));
    expect(screen.getByRole("status")).toHaveTextContent("Sayfa hazırlanıyor");
  });

  it("renders a useful home action for unknown routes", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { level: 1, name: "Sayfa bulunamadı" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ana sayfaya dön" })).toHaveAttribute("href", "/");
  });

  it("keeps technical errors private and delegates recovery to Next.js", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const error = new Error("SECRET database implementation detail");

    render(<AppError error={error} retry={retry} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Bir şeyler ters gitti");
    expect(alert).not.toHaveTextContent("SECRET database implementation detail");

    await user.click(screen.getByRole("button", { name: "Tekrar dene" }));

    expect(retry).toHaveBeenCalledOnce();
  });
});
