"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button 
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-default bg-surface"
        aria-label="Toggle dark mode"
      >
        <Sun className="w-[18px] h-[18px] text-[var(--text-secondary)]" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-default bg-surface text-[var(--text-primary)] hover:bg-[var(--bg-soft)] transition-colors"
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? (
        <Sun className="w-[18px] h-[18px] text-amber-500" />
      ) : (
        <Moon className="w-[18px] h-[18px] text-[var(--text-primary)]" />
      )}
    </button>
  );
}
