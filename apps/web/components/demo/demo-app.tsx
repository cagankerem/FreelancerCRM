"use client";

import { PrototypeApp } from "./prototype-app";

type DemoAppProps = {
  layout?: "page" | "embedded";
};

export function DemoApp({ layout = "page" }: DemoAppProps) {
  return <PrototypeApp mode="demo" layout={layout} />;
}
