"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme, systemTheme } = useTheme();
  const current = theme === "system" ? systemTheme : theme;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setTheme(current === "dark" ? "light" : "dark")}
      className={cn(
        "rounded-full border border-fog/40 bg-white/70 px-4 py-2 text-sm font-semibold text-ink shadow-soft transition dark:bg-ink/60 dark:text-paper",
        className
      )}
    >
      {mounted ? (current === "dark" ? "Light Mode" : "Dark Mode") : "Theme"}
    </button>
  );
}
