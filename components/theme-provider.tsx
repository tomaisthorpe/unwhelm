"use client";

import { useTheme } from "@/lib/hooks/use-theme";
import { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useTheme();
  return <>{children}</>;
}
