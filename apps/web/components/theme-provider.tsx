"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

type ThemeProviderProps = Omit<
  ComponentProps<typeof NextThemesProvider>,
  | "attribute"
  | "defaultTheme"
  | "enableColorScheme"
  | "enableSystem"
  | "storageKey"
>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableColorScheme
      enableSystem
      storageKey="kapsam-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
