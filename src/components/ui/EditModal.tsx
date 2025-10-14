"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { CardDTO } from "@/src/lib/types/card";

type EditPayload = {
  prompt: string;
  answer: string;
  tags: string[];
};

export default function EditModal({
  card,
  onClose,
  onSubmit,
}: {
  card: CardDTO;
  onClose: () => void;
  onSubmit: (payload: EditPayload) => Promise<void> | void;
}) {
  const [prompt, setPrompt] = useState(card.prompt);
  const [answer, setAnswer] = useState(card.answer);
  const [tags, setTags] = useState<string[]>(card.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLTextAreaElement>(null);

  const canSave = useMemo(
    () => prompt.trim().length > 0 && answer.trim().length > 0,
    [prompt, answer]
  );

  // Lock background scroll and focus first field
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstFieldRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Esc; Save on Cmd/Ctrl+S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Close if clicking backdrop
  const onBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === dialogRef.current) onClose();
  };

  const addTagFromInput = () => {
    const raw = tagInput.trim();
    if (!raw) return;
    const parts = raw
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = Array.from(new Set([...tags, ...parts.map(sanitizeTag)]));
    setTags(next);
    setTagInput("");
  };

  const removeTag = (t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSubmit({
        prompt: prompt.trim(),
        answer: answer.trim(),
        tags,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-card-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onBackdropClick}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 id="edit-card-title" className="text-lg font-semibold">
            Edit Card
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm mb-1">Prompt</label>
            <textarea
              ref={firstFieldRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              placeholder="Edit the prompt / question…"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Answer</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              placeholder="Edit the answer…"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Tags</label>
            <div className="rounded-md border border-[var(--border)] p-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs"
                  >
                    {t}
                    <button
                      type="button"
                      aria-label={`Remove tag ${t}`}
                      className="-mr-0.5 ml-1 rounded-full px-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/70"
                      onClick={() => removeTag(t)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTagFromInput();
                  }
                }}
                placeholder="Add tag and press Enter"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Use commas or Enter to add multiple tags.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[var(--border)] text-sm hover:opacity-90"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className={`px-4 py-2 rounded-md text-sm text-[var(--primary-foreground)] ${
              canSave && !saving
                ? "bg-[var(--primary)] hover:opacity-90"
                : "bg-[var(--primary)] opacity-50 cursor-not-allowed"
            }`}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function sanitizeTag(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9-_\\s]/g, "").trim().replace(/\s+/g, "-");
}
