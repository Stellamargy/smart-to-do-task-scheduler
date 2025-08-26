import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Cycle order: light → dark → system → light ...
  const nextTheme = theme === "light"
    ? "dark"
    : theme === "dark"
      ? "system"
      : "light";

  // Pick icon for current theme
  let Icon = Sun;
  if (theme === "dark") Icon = Moon;
  if (theme === "system") Icon = Laptop;

  // Handle theme toggle and store in localStorage
  const handleToggle = () => {
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", nextTheme);
    }
  };

  return (
    <Button variant="outline" size="icon" onClick={handleToggle}>
      <span className="sr-only">Toggle theme</span>
      <Icon className="h-[1.2rem] w-[1.2rem] transition-all" />
    </Button>
  );
}