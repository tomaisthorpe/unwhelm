"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

function getResolvedTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const resolved = getResolvedTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("unwhelm-theme") as Theme) ?? "system";
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    applyTheme(theme);
    setMounted(true);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const current = (localStorage.getItem("unwhelm-theme") as Theme) ?? "system";
      if (current === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("unwhelm-theme", t);
    applyTheme(t);
  }

  return { theme, resolvedTheme: getResolvedTheme(theme), setTheme, mounted };
}
