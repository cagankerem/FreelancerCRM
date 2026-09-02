import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

describe("form control design contracts", () => {
  it("uses semantic field colors and the documented input geometry", () => {
    render(<Input aria-label="E-posta" />);

    expect(screen.getByRole("textbox", { name: "E-posta" })).toHaveClass(
      "h-12",
      "min-h-12",
      "rounded-[14px]",
      "border-input",
      "bg-card",
    );
  });

  it("uses semantic field colors and the documented select geometry", () => {
    render(
      <NativeSelect aria-label="Meslek">
        <NativeSelectOption value="developer">Yazılımcı</NativeSelectOption>
      </NativeSelect>,
    );

    expect(screen.getByRole("combobox", { name: "Meslek" })).toHaveClass(
      "h-12",
      "min-h-12",
      "rounded-[14px]",
      "border-input",
      "bg-card",
    );
  });
});
