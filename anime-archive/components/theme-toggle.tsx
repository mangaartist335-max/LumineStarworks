"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // The theme is only known after hydration, so the label stays the same on server and client.
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle light and dark mode"
      title="Toggle light and dark mode"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
    >
      <Sun className="hidden size-4 [html.light_&]:block" />
      <Moon className="size-4 [html.light_&]:hidden" />
    </Button>
  );
}
