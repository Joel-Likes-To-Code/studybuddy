// src/components/ui/SettingsButton.tsx
"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";

export default function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("light");

  // Load saved preferences
  useEffect(() => {
    const m = (localStorage.getItem("sb-mode") as Mode) || "light";
    setMode(m);
    applyTheme(m);
  }, []);

  // Apply preferences
  const applyTheme = (m: Mode) => {
    const root = document.documentElement;

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
    applyTheme(mode);
    setOpen(false);
  };

  // Handle system mode live updates
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

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
