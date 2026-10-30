import { useEffect, useState } from "react";
import { Button } from "./Buttons";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <Button
      type="button"
      variant="outlined"
      size="sm"
      onClick={() => setIsDark((prev) => !prev)}
      className="text-xs"
    >
      {isDark ? "☀️" : "🌙"}
    </Button>
  );
}