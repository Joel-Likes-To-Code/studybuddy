// src/components/ui/SettingsButton.tsx
"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";
type Palette = "calm-spark" | "fresh-focus" | "grounded-glow";

export default function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("light");
  const [palette, setPalette] = useState<Palette>("calm-spark");

  // Load saved preferences
  useEffect(() => {
    const m = (localStorage.getItem("sb-mode") as Mode) || "light";
    const p = (localStorage.getItem("sb-palette") as Palette) || "calm-spark";
    setMode(m);
    setPalette(p);
    applyTheme(m, p);
  }, []);

  // Apply preferences
  const applyTheme = (m: Mode, p: Palette) => {
    const root = document.documentElement;
    // palette
    root.setAttribute("data-palette", p);

    // mode
    if (m === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      root.setAttribute("data-theme", m);
    }
  };

  const onSave = () => {
    localStorage.setItem("sb-mode", mode);
    localStorage.setItem("sb-palette", palette);
    applyTheme(mode, palette);
    setOpen(false);
  };

  // Handle system mode live updates
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system", palette);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, palette]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm hover:underline"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Settings
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Appearance settings"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button
                className="rounded-md px-2 py-1 text-sm hover:opacity-80"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-6">
              {/* Mode */}
              <section>
                <h3 className="text-sm font-medium mb-2">Theme mode</h3>
                <div className="flex gap-2">
                  {(["light", "dark", "system"] as Mode[]).map((m) => (
                    <label key={m} className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        className="accent-[var(--primary)]"
                        checked={mode === m}
                        onChange={() => setMode(m)}
                      />
                      <span className="capitalize">{m}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Palette */}
              <section>
                <h3 className="text-sm font-medium mb-2">Color palette</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { id: "calm-spark", name: "Calm Spark", swatch: ["#2563eb", "#10b981", "#f59e0b"] },
                    { id: "fresh-focus", name: "Fresh Focus", swatch: ["#0ea5e9", "#14b8a6", "#fb7185"] },
                    { id: "grounded-glow", name: "Grounded Glow", swatch: ["#16a34a", "#e7e5e4", "#f59e0b"] },
                  ] as { id: Palette; name: string; swatch: string[] }[]).map((p) => (
                    <label
                      key={p.id}
                      className={`rounded-lg border px-3 py-2 text-sm cursor-pointer transition ${palette === p.id ? "border-[var(--accent)] ring-2 ring-[var(--ring)]" : "border-[var(--border)]"}`}
                    >
                      <input
                        type="radio"
                        name="palette"
                        className="sr-only"
                        checked={palette === p.id}
                        onChange={() => setPalette(p.id)}
                      />
                      <div className="font-medium">{p.name}</div>
                      <div className="mt-2 flex gap-1">
                        {p.swatch.map((c) => (
                          <span key={c} className="h-4 w-6 rounded" style={{ background: c }} />
                        ))}
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="px-4 py-2 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
