'use client';

import EditModal from '@/src/components/ui/EditModal';
import { createCard, deleteCard, updateCard } from '@/src/lib/actions/cardActions';
import { CardDTO, NewCardInput, TabKey } from '@/src/lib/types/card';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import CardDisplay from './CardDisplay';
import CardViewer from './CardViewer';

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
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [viewingCard, setViewingCard] = useState<CardDTO | null>(null);
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
      console.error('Create failed:', err);
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
      setCards((prev) => prev.map((c) => (c.id === editingCard.id ? optimisticCard : c)));

      closeEditModal();

      try {
        const updated = await updateCard(editingCard.id, payload);
        if (updated) {
          setCards((prev) => prev.map((c) => (c.id === editingCard.id ? { ...c, ...updated } : c)));
        }
      } catch (err) {
        console.error('Update failed:', err);
        setCards(prevCards);
      }
    },
    [cards, editingCard],
  );

  const handleDelete = useCallback(async (card: CardDTO) => {
    setDeletingIds((prev) => new Set(prev).add(card.id));
    setCards((prev) => prev.filter((c) => c.id !== card.id));
    try {
      await deleteCard(card.id);
    } catch (err) {
      console.error('Delete failed:', err);
      setCards((prev) => [card, ...prev]);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
    }
  }, []);

  const openCardViewModal = (card: CardDTO) => {
    setViewingCard(card);
    setViewModalOpen(true);
  };

  const closeCardViewer = () => {
    setViewingCard(null);
    setViewModalOpen(false);
  };

  let panel: React.ReactNode;
  switch (activeTab) {
    case TabKey.Manual:
      panel = (
        <ManualCreator
          onSave={saveToServer}
          cards={cards}
          openEditModal={openEditModal}
          handleDelete={handleDelete}
          openCardViewModal={openCardViewModal}
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
          onView={(card) => openCardViewModal(card)}
        />
      );
      break;
    default:
      panel = null;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
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
              className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors outline-none ${
                activeTab === tab
                  ? 'border-[var(--accent)] text-[var(--foreground)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <section className="mt-6">{panel}</section>

      {isEditModalOpen && editingCard && (
        <EditModal card={editingCard} onClose={closeEditModal} onSubmit={handleEditSubmit} />
      )}

      {isViewModalOpen && viewingCard && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-[var(--card-foreground)] shadow-xl">
            <CardViewer
              cards={cards}
              initialIndex={cards.findIndex((c) => c.id === viewingCard.id)}
              onClose={closeCardViewer}
            />
          </div>
        </div>
      )}
    </main>
  );
}

function QuickPlaceholder() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Quick Create</h2>
      <p className="text-sm text-[var(--muted-foreground)]">
        This area is reserved for quick-create flows (e.g., paste text to auto-generate cards).
      </p>
      <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4 text-[var(--card-foreground)]">
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
  openCardViewModal,
}: {
  onSave?: (input: NewCardInput) => Promise<void> | void;
  cards?: CardDTO[];
  openEditModal: (card: CardDTO) => void;
  handleDelete: (card: CardDTO) => void;
  openCardViewModal: (card: CardDTO) => void;
}) {
  const [prompt, setFront] = useState('');
  const [answer, setBack] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagsValid = tags.length > 0;

  const canSave = useMemo(
    () => prompt.trim().length > 0 && answer.trim().length > 0 && tagsValid,
    [prompt, answer, tagsValid],
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
      setFront('');
      setBack('');
      setTags([]);
      setTagInput('');
      setAttemptedSave(false);
    } catch (e) {
      console.error('Failed to save card:', e);
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
        <h2 className="self-end text-xl font-semibold">Manual Create</h2>
        <h3 className="self-end text-xl font-semibold">Recently Created Cards</h3>

        {/* Row 2, Col 1: Creator + Tags (top-aligned; optional sticky) */}
        <div className="space-y-6 self-start lg:sticky lg:top-4">
          {/* Flip card */}
          <FlipCard isFlipped={isFlipped} onToggle={() => setIsFlipped((v) => !v)}>
            {/* Front */}
            <div className="h-full w-full p-4">
              <div className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">Front</div>
              <textarea
                aria-label="Front text"
                placeholder="Type the prompt/question..."
                value={prompt}
                onChange={(e) => setFront(e.target.value)}
                className="h-[220px] w-full resize-none rounded-md border border-[var(--border)] bg-[var(--card)] p-3 text-sm text-[var(--card-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
              />
              <div className="mt-3 text-xs text-[var(--muted-foreground)]">
                Click the right edge to flip →
              </div>
            </div>

            {/* Back */}
            <div className="h-full w-full p-4">
              <div className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">Back</div>
              <textarea
                aria-label="Back text"
                placeholder="Type the answer..."
                value={answer}
                onChange={(e) => setBack(e.target.value)}
                className="h-[220px] w-full resize-none rounded-md border border-[var(--border)] bg-[var(--card)] p-3 text-sm text-[var(--card-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
              />
              <div className="mt-3 text-xs text-[var(--muted-foreground)]">
                Click the left edge to flip ←
              </div>
            </div>
          </FlipCard>

          {/* Tags + Actions (group keeps Save-hover glow) */}
          <div className="group space-y-4">
            <div>
              <label htmlFor="tags" className="mb-1 block text-sm font-medium">
                Tags
              </label>

              <div
                className={[
                  'rounded-md border border-[var(--border)] bg-[var(--card)] p-2 transition-shadow',
                  tags.length === 0
                    ? 'group-hover:shadow-[0_0_0.75rem_var(--accent)] group-hover:ring-2 group-hover:ring-[var(--accent)]'
                    : '',
                ].join(' ')}
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
                        className="inline-flex size-5 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--muted)]/90 hover:text-[var(--foreground)]/90 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
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
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const raw = tagInput.trim();
                        if (!raw) return;
                        const parts = raw
                          .split(/[,\s]+/)
                          .map((t) => t.trim())
                          .filter(Boolean);
                        if (!parts.length) return;
                        const next = Array.from(
                          new Set([...tags, ...parts.map((t) => sanitizeTag(t))]),
                        );
                        setTags(next);
                        setTagInput('');
                      }
                    }}
                    placeholder={tags.length ? 'Add more...' : 'Add tag and press Enter'}
                    aria-invalid={tags.length === 0 && attemptedSave}
                    aria-describedby={tags.length === 0 && attemptedSave ? 'tags-help' : undefined}
                    className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] p-2 pr-12 text-sm text-[var(--card-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
                  />

                  {/* Arrow button placed 'inside' the input on the right */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const raw = tagInput.trim();
                      if (!raw) return;
                      const parts = raw
                        .split(/[,\s]+/)
                        .map((t) => t.trim())
                        .filter(Boolean);
                      if (!parts.length) return;
                      const next = Array.from(
                        new Set([...tags, ...parts.map((t) => sanitizeTag(t))]),
                      );
                      setTags(next);
                      setTagInput('');
                    }}
                    disabled={!tagInput.trim()}
                    aria-label="Add tag"
                    title="Add tag"
                    className={`absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--card)] ${
                      tagInput.trim()
                        ? 'cursor-pointer hover:bg-[var(--muted)]'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
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
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave || saving}
                className={`rounded-md px-4 py-2 text-sm text-[var(--primary-foreground)] transition-opacity ${
                  canSave && !saving
                    ? 'bg-[var(--primary)] hover:opacity-90'
                    : 'cursor-not-allowed bg-[var(--primary)] opacity-50'
                }`}
              >
                {saving ? 'Saving…' : 'Save Card'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFront('');
                  setBack('');
                  setTags([]);
                  setTagInput('');
                  setIsFlipped(false);
                }}
                className="rounded-md border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--card-foreground)] hover:opacity-90"
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
            onView={(card) => openCardViewModal(card)}
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
    <div className="relative w-full max-w-xl [perspective:1000px]">
      <div
        className={`h[300px] relative h-[300px] w-full rounded-lg border border-[var(--border)] bg-[var(--card)] transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <button
          type="button"
          aria-label="Flip card"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 z-10 w-8 rounded-r-lg hover:bg-[var(--muted)]/50 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
        />
        <button
          type="button"
          aria-label="Flip card"
          onClick={onToggle}
          className="absolute inset-y-0 left-0 z-10 w-8 rounded-l-lg hover:bg-[var(--muted)]/50 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
        />
        <div className="absolute inset-0 [backface-visibility:hidden]">{front}</div>
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
    .replace(/[^a-z0-9-_\\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
