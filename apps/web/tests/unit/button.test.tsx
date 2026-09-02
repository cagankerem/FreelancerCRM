import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("exposes an accessible name and handles user activation", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Teklif oluştur</Button>);

    const button = screen.getByRole("button", { name: "Teklif oluştur" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("h-[42px]");
    expect(button).toHaveClass("rounded-[14px]");
    expect(button).toHaveClass("bg-action-primary");

    await user.click(button);

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("uses the documented large-button height", () => {
    render(<Button size="lg">Devam et</Button>);

    expect(screen.getByRole("button", { name: "Devam et" })).toHaveClass(
      "h-[52px]",
    );
  });
});
