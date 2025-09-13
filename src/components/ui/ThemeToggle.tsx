"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark";
type Palette = "calm-spark"; // add more later: "fresh-focus" | "grounded-glow"

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("light");
  const [palette, setPalette] = useState<Palette>("calm-spark");

  // Load saved prefs
  useEffect(() => {
    const savedMode = (localStorage.getItem("sb-mode") as Mode) || "light";
    const savedPalette = (localStorage.getItem("sb-palette") as Palette) || "calm-spark";
    setMode(savedMode);
    setPalette(savedPalette);
  }, []);

  // Apply to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", mode === "dark" ? "dark" : "light");
    // If you add multiple palettes, you can also set data-palette and target it in CSS if needed:
    root.setAttribute("data-palette", palette);
    localStorage.setItem("sb-mode", mode);
    localStorage.setItem("sb-palette", palette);
  }, [mode, palette]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        className="px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] hover:opacity-90"
        onClick={() => setMode((m) => (m === "light" ? "dark" : "light"))}
        aria-label="Toggle dark mode"
      >
        {mode === "dark" ? "Dark" : "Light"}
      </button>

      {/* Palette selector is future-proof; currently only one */}
      <select
        value={palette}
        onChange={(e) => setPalette(e.target.value as Palette)}
        className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]"
        aria-label="Theme palette"
      >
        <option value="calm-spark">Calm Spark</option>
        {/* <option value="fresh-focus">Fresh Focus</option>
        <option value="grounded-glow">Grounded Glow</option> */}
      </select>
    </div>
  );
}
