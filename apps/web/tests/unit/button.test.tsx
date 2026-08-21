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

    await user.click(button);

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
