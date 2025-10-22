"use client";

import React, { useCallback, useState, useMemo, useRef } from "react";
import CardDisplay from "./CardDisplay";
import { NewCardInput, TabKey, CardDTO } from "@/src/lib/types/card";
import {
  createCard,
  deleteCard,
  updateCard,
} from "@/src/lib/actions/cardActions";
import EditModal from "@/src/components/ui/EditModal";

export default function DashboardClient({
  userName,
  initialCards,
}: {
  userName: string;
  initialCards: CardDTO[];
}) {
  // State
  const [activeTab, setActiveTab] = useState<TabKey>(TabKey.Manual);
  const [cards, setCards] = useState<CardDTO[]>(initialCards);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardDTO | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Handlers
  const saveToServer = useCallback(async (input: NewCardInput) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const tempCard: CardDTO = {
      id: tempId,
      prompt: input.prompt,
      answer: input.answer,
      tags: input.tags,
      createdAt: new Date().toISOString(),
    };

    // optimistic insert
    setCards((prev) => [tempCard, ...prev]);

    try {
      const saved = await createCard(input);
      // replace temp with real
      setCards((prev) => prev.map((c) => (c.id === tempId ? saved : c)));
    } catch (err) {
      console.error("Create failed:", err);
      // rollback
      setCards((prev) => prev.filter((c) => c.id !== tempId));
    }
  }, []);

  const openEditModal = (card: CardDTO) => {
    setEditingCard(card);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingCard(null);
    setIsEditModalOpen(false);
  };

  const handleEditSubmit = useCallback(
    async (payload: { prompt: string; answer: string; tags: string[] }) => {
      if (!editingCard) return;

      const prevCards = cards;

      const optimisticCard: CardDTO = {
        ...editingCard,
        prompt: payload.prompt,
        answer: payload.answer,
        tags: payload.tags,
      };
      setCards((prev) =>
        prev.map((c) => (c.id === editingCard.id ? optimisticCard : c))
      );

      closeEditModal();

      try {
        const updated = await updateCard(editingCard.id, payload);
        if (updated) {
          setCards((prev) =>
            prev.map((c) =>
              c.id === editingCard.id ? { ...c, ...updated } : c
            )
          );
        }
      } catch (err) {
        console.error("Update failed:", err);
        setCards(prevCards);
      }
    },
    [cards, editingCard]
  );

  const handleDelete = useCallback(async (card: CardDTO) => {
    setDeletingIds((prev) => new Set(prev).add(card.id));
    setCards((prev) => prev.filter((c) => c.id !== card.id));
    try {
      await deleteCard(card.id);
    } catch (err) {
      console.error("Delete failed:", err);
      setCards((prev) => [card, ...prev]);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
    }
  }, []);

  let panel: React.ReactNode;
  switch (activeTab) {
    case TabKey.Manual:
      panel = (
        <ManualCreator
          onSave={saveToServer}
          cards={cards}
          openEditModal={openEditModal}
          handleDelete={handleDelete}
        />
      );
      break;
    case TabKey.Quick:
      panel = <QuickPlaceholder />;
      break;
    case TabKey.Cards:
      panel = (
        <CardDisplay
          cards={cards}
          limit={5}
          onEdit={async (card) => openEditModal(card)}
          onDelete={handleDelete}
        />
      );
      break;
    default:
      panel = null;
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </header>

      <p className="text-lg">
        Welcome back, <span className="font-medium">{userName}</span>!
      </p>

      {/* Tabs */}
      <div className="border-b border-[var(--border)]">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {Object.values(TabKey).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium outline-none border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? "border-[var(--accent)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <section className="mt-6">{panel}</section>

      {isEditModalOpen && editingCard && (
        <EditModal
          card={editingCard}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
        />
      )}
    </main>
  );
}

function QuickPlaceholder() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Quick Create</h2>
      <p className="text-[var(--muted-foreground)] text-sm">
        This area is reserved for quick-create flows (e.g., paste text to
        auto-generate cards).
      </p>
      <div className="rounded-md border border-[var(--border)] p-4 bg-[var(--card)] text-[var(--card-foreground)]">
        <p className="text-sm">Coming soon.</p>
      </div>
    </section>
  );
}

function ManualCreator({
  onSave,
  cards,
  openEditModal,
  handleDelete,
}: {
  onSave?: (input: NewCardInput) => Promise<void> | void;
  cards?: CardDTO[];
  openEditModal: (card: CardDTO) => void;
  handleDelete: (card: CardDTO) => void;
}) {
  const [prompt, setFront] = useState("");
  const [answer, setBack] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagsValid = tags.length > 0;

  const canSave = useMemo(
    () => prompt.trim().length > 0 && answer.trim().length > 0 && tagsValid,
    [prompt, answer, tagsValid]
  );
  const handleSave = async () => {
    if (saving) return;

    if (!tagsValid) {
      setAttemptedSave(true);
      tagInputRef.current?.focus();
      return;
    }

    if (!canSave) return;

    const payload: NewCardInput = {
      prompt: prompt.trim(),
      answer: answer.trim(),
      tags,
    };

    try {
      setIsFlipped(false);
      setSaving(true);
      await onSave?.(payload);
      setFront("");
      setBack("");
      setTags([]);
      setTagInput("");
      setAttemptedSave(false);
    } catch (e) {
      console.error("Failed to save card:", e);
    } finally {
      setSaving(false);
    }
  };

return (
  <section className="space-y-4">
    {/* Two-row grid:
         Row 1: headers (left & right) on the same line
         Row 2: content columns (left = creator+tags, right = card list) */}
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Row 1: aligned headings */}
      <h2 className="text-xl font-semibold self-end">Manual Create</h2>
      <h3 className="text-xl font-semibold self-end">Recently Created Cards</h3>

      {/* Row 2, Col 1: Creator + Tags (top-aligned; optional sticky) */}
      <div className="space-y-6 lg:sticky lg:top-4 self-start">
        {/* Flip card */}
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
              value={prompt}
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
              value={answer}
              onChange={(e) => setBack(e.target.value)}
              className="w-full h-[220px] resize-none rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] text-sm"
            />
            <div className="mt-3 text-xs text-[var(--muted-foreground)]">
              Click the left edge to flip ←
            </div>
          </div>
        </FlipCard>

        {/* Tags + Actions (group keeps Save-hover glow) */}
        <div className="space-y-4 group">
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-1">
              Tags
            </label>

            <div
              className={[
                "rounded-md border p-2 bg-[var(--card)] border-[var(--border)] transition-shadow",
                tags.length === 0
                  ? "group-hover:ring-2 group-hover:ring-[var(--accent)] group-hover:shadow-[0_0_0.75rem_var(--accent)]"
                  : "",
              ].join(" ")}
              aria-live="polite"
            >
              {/* tag chips */}
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--muted)]/70 px-3 py-1 text-xs font-medium text-[var(--foreground)]/90"
                  >
                    {t}
                    <button
                      type="button"
                      aria-label={`Remove tag ${t}`}
                      onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                      className="inline-flex items-center justify-center size-5 rounded-full text-[var(--muted-foreground)] hover:bg-[var(--muted)]/90 hover:text-[var(--foreground)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* tag input */}
              <div className="relative mt-2">
                <input
                  id="tags"
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      const raw = tagInput.trim();
                      if (!raw) return;
                      const parts = raw.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
                      if (!parts.length) return;
                      const next = Array.from(new Set([...tags, ...parts.map((t) => sanitizeTag(t))]));
                      setTags(next);
                      setTagInput("");
                    }
                  }}
                  placeholder={tags.length ? "Add more..." : "Add tag and press Enter"}
                  aria-invalid={tags.length === 0 && attemptedSave}
                  aria-describedby={tags.length === 0 && attemptedSave ? "tags-help" : undefined}
                  className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]
                            p-2 pr-12 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                />

                {/* Arrow button placed 'inside' the input on the right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const raw = tagInput.trim();
                    if (!raw) return;
                    const parts = raw.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
                    if (!parts.length) return;
                    const next = Array.from(new Set([...tags, ...parts.map((t) => sanitizeTag(t))]));
                    setTags(next);
                    setTagInput("");
                  }}
                  disabled={!tagInput.trim()}
                  aria-label="Add tag"
                  title="Add tag"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center
                              h-8 w-8 rounded-md border border-[var(--border)] bg-[var(--card)]
                              ${tagInput.trim()
                                ? "hover:bg-[var(--muted)] cursor-pointer"
                                : "opacity-50 cursor-not-allowed"}`}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                    <path d="M13 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {tags.length === 0 && attemptedSave && (
              <p id="tags-help" className="mt-2 text-xs text-[var(--muted-foreground)]">
                Please add at least one tag to save this card.
              </p>
            )}

            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Tags help group related cards.
            </p>
          </div>


          {/* actions */}
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
        </div>
      </div>

      {/* Row 2, Col 2: Card list (top-aligned) */}
      <aside className="space-y-4 self-start">
        {/* Heading is in row 1; just the list here */}
        <CardDisplay
          cards={cards ?? []}
          limit={5}
          onEdit={async (card) => openEditModal(card)}
          onDelete={handleDelete}
        />
      </aside>
    </div>
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
  children: React.ReactNode;
}) {
  const faces = React.Children.toArray(children);
  const front = faces[0] ?? null;
  const back = faces[1] ?? null;

  return (
    <div className="relative [perspective:1000px] max-w-xl w-full">
      <div
        className={`relative h[300px] h-[300px] w-full rounded-lg border border-[var(--border)] bg-[var(--card)] transition-transform duration-500 [transform-style:preserve-3d] ${
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
        <div className="absolute inset-0 [backface-visibility:hidden]">
          {front}
        </div>
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
    .replace(/[^a-z0-9-_\\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
