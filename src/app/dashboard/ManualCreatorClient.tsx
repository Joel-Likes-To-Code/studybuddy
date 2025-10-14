"use client";

import React, { useMemo, useState } from "react";

type TabKey = "manual" | "quick";

export type NewCardInput = {
  front: string;
  back: string;
  tags: string[];
};



/** If you later want to type server-returned cards, keep this around */
// export type Card = {
//   id: string;
//   front: string;
//   back: string;
//   tags: string[];
//   createdAt: string;
// };

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("manual");
  
  async function saveToServer(input: NewCardInput) {
    // TODO: replace with your real call (Prisma via /api/cards or Supabase client)
    // Example:
    // await fetch("/api/cards", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(input),
    // });
    console.log("TODO: send to server:", input);
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </header>

      {/* Tabs */}
      <div className="border-b border-[var(--border)]">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`pb-3 text-sm font-medium outline-none border-b-2 -mb-px transition-colors ${
              activeTab === "manual"
                ? "border-[var(--accent)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Manual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quick")}
            className={`pb-3 text-sm font-medium outline-none border-b-2 -mb-px transition-colors ${
              activeTab === "quick"
                ? "border-[var(--accent)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Quick
          </button>
        </nav>
      </div>

      {/* Panels */}
      {activeTab === "manual" ? (
        <ManualCreator onSave={saveToServer} />
      ) : (
        <QuickPlaceholder />
      )}
    </main>
  );
}

function QuickPlaceholder() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Quick Create</h2>
      <p className="text-[var(--muted-foreground)] text-sm">
        This area is reserved for quick-create flows (e.g., paste text to auto-generate cards).
      </p>
      <div className="rounded-md border border-[var(--border)] p-4 bg-[var(--card)] text-[var(--card-foreground)]">
        <p className="text-sm">Coming soon.</p>
      </div>
    </section>
  );
}

function ManualCreator({
  onSave,
}: {
  onSave?: (input: NewCardInput) => Promise<void> | void;
}) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(
    () => front.trim().length > 0 && back.trim().length > 0,
    [front, back]
  );

  const addTagFromInput = () => {
    const raw = tagInput.trim();
    if (!raw) return;
    const parts = raw
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = Array.from(
      new Set([...tags, ...parts.map((t) => sanitizeTag(t))])
    );
    setTags(next);
    setTagInput("");
  };

  const removeTag = (t: string) =>
    setTags((prev) => prev.filter((x) => x !== t));

  const handleSave = async () => {
    if (!canSave || saving) return;

    const payload: NewCardInput = {
      front: front.trim(),
      back: back.trim(),
      tags,
    };

    try {
      setSaving(true);
      if (onSave) {
        await onSave(payload);
      } else {
        // Fallback: just log so you can see the payload while wiring your API
        console.log("New card payload:", payload);
      }

      // reset form after a successful save
      setFront("");
      setBack("");
      setTags([]);
      setIsFlipped(false);
      setTagInput("");
    } catch (e) {
      console.error("Failed to save card:", e);
      // Optional: show a toast/error UI here
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Manual Create</h2>
      </div>

      {/* Card builder */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Flip card */}
        <div className="flex items-center justify-center">
          <FlipCard
            isFlipped={isFlipped}
            onToggle={() => setIsFlipped((v) => !v)}
          >
            {/* Front */}
            <div className="h-full w-full p-4">
              <div className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                Front
              </div>
              <textarea
                aria-label="Front text"
                placeholder="Type the prompt/question..."
                value={front}
                onChange={(e) => setFront(e.target.value)}
                className="w-full h-[220px] resize-none rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] text-sm"
              />
              <div className="mt-3 text-xs text-[var(--muted-foreground)]">
                Click the right edge to flip →
              </div>
            </div>

            {/* Back */}
            <div className="h-full w-full p-4">
              <div className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                Back
              </div>
              <textarea
                aria-label="Back text"
                placeholder="Type the answer..."
                value={back}
                onChange={(e) => setBack(e.target.value)}
                className="w-full h-[220px] resize-none rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] text-sm"
              />
              <div className="mt-3 text-xs text-[var(--muted-foreground)]">
                Click the left edge to flip ←
              </div>
            </div>
          </FlipCard>
        </div>

        {/* Details & tags */}
        <aside className="space-y-4">
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-1">
              Tags
            </label>
            <div className="rounded-md border border-[var(--border)] p-2 bg-[var(--card)]">
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] text-[var(--foreground)]/80 px-2 py-0.5 text-xs"
                  >
                    {t}
                    <button
                      type="button"
                      aria-label={`Remove tag ${t}`}
                      className="-mr-0.5 ml-1 rounded-full px-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/70"
                      onClick={() => removeTag(t)}
                    >
                    </button>
                  </span>
                ))}
              </div>
              <input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTagFromInput();
                  }
                }}
                placeholder="Add tag and press Enter"
                className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
            </div>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Tags help group related cards.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
              className={`px-4 py-2 rounded-md text-[var(--primary-foreground)] text-sm transition-opacity ${
                canSave && !saving
                  ? "bg-[var(--primary)] hover:opacity-90"
                  : "bg-[var(--primary)] opacity-50 cursor-not-allowed"
              }`}
            >
              {saving ? "Saving…" : "Save Card"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFront("");
                setBack("");
                setTags([]);
                setTagInput("");
                setIsFlipped(false);
              }}
              className="px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] text-sm hover:opacity-90"
            >
              Reset
            </button>
          </div>
        </aside>
      </div>
      <section className="text-sm text-[var(--muted-foreground)]">
      

      </section>
    </section>
  );
}

function FlipCard({
  isFlipped,
  onToggle,
  children,
}: {
  isFlipped: boolean;
  onToggle: () => void;
  children: React.ReactNode; // expects exactly two children: [front, back]
}) {
  const faces = React.Children.toArray(children);
  const front = faces[0] ?? null;
  const back = faces[1] ?? null;

  return (
    <div className="relative [perspective:1000px] max-w-xl w-full">
      <div
        className={`relative h-[300px] w-full rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <button
          type="button"
          aria-label="Flip card"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 w-8 rounded-r-lg hover:bg-[var(--muted)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] z-10"
        />
        <button
          type="button"
          aria-label="Flip card"
          onClick={onToggle}
          className="absolute inset-y-0 left-0 w-8 rounded-l-lg hover:bg-[var(--muted)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] z-10"
        />

        {/* Face */}
        <div className="absolute inset-0 [backface-visibility:hidden]">{front}</div>
        {/* Back */}
        <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
          {back}
        </div>
      </div>
    </div>
  );
}

function sanitizeTag(t: string) {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9\-\_\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
