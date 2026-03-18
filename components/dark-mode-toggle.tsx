"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/hooks/use-theme";

export function DarkModeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) return <div className="w-9 h-9" />;

  function cycle() {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  }

  const Icon =
    theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label =
    theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

  return (
    <Button variant="ghost" size="sm" onClick={cycle} title={`Theme: ${label}`}>
      <Icon className="w-4 h-4" />
    </Button>
  );
}
