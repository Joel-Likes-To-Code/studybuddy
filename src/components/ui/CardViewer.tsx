'use client';

import type { CardDTO } from '@/src/lib/types/card';
import React, { useCallback, useEffect, useState } from 'react';

export default function CardViewer({
  cards,
  initialIndex = 0,
  onClose,
}: {
  cards: CardDTO[];
  initialIndex?: number;
  onClose?: () => void; // pass this if you show it in a modal
}) {
  // clamp helper
  const clampIndex = useCallback(
    (i: number) => Math.min(Math.max(i, 0), Math.max(cards.length - 1, 0)),
    [cards.length],
  );

  // keep index in sync with props (when opening different card or list changes)
  const [index, setIndex] = useState(() => clampIndex(initialIndex));
  useEffect(() => {
    setIndex(clampIndex(initialIndex));
  }, [initialIndex, clampIndex]);

  const [isFlipped, setIsFlipped] = useState(false);

  // reset flip when index changes
  useEffect(() => {
    setIsFlipped(false);
  }, [index]);

  const card = cards[index];
  const total = cards.length;
  const atStart = index <= 0;
  const atEnd = index >= total - 1;

  const gotoPrev = useCallback(() => {
    setIndex((i) => clampIndex(i - 1));
  }, [clampIndex]);

  const gotoNext = useCallback(() => {
    setIndex((i) => clampIndex(i + 1));
  }, [clampIndex]);

  const flip = useCallback(() => setIsFlipped((v) => !v), []);

  // Keyboard: Space flip, Arrows navigate, Esc close (if onClose provided)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        flip();
      } else if (e.key === 'ArrowRight') {
        gotoNext();
      } else if (e.key === 'ArrowLeft') {
        gotoPrev();
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flip, gotoNext, gotoPrev, onClose]);

  if (!card) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4 text-[var(--card-foreground)]">
        <p className="text-sm text-[var(--muted-foreground)]">No cards to review.</p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Header / Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--muted-foreground)]">
          Card <span className="font-medium text-[var(--foreground)]">{index + 1}</span> of{' '}
          <span className="font-medium text-[var(--foreground)]">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:opacity-90"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Flip Card */}
      <div className="flex items-center justify-center">
        <FlipCard isFlipped={isFlipped} onToggle={flip}>
          {/* FRONT (prompt) */}
          <div className="h-full w-full p-4">
            <div className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">Question</div>
            <div className="h-[220px] overflow-auto rounded-md border border-[var(--border)] bg-[var(--card)] p-3 text-sm">
              {card.prompt}
            </div>
            <div className="mt-3 text-xs text-[var(--muted-foreground)]">
              Click edges or press Space to flip →
            </div>
          </div>

          {/* BACK (answer) */}
          <div className="h-full w-full p-4">
            <div className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">Answer</div>
            <div className="h-[220px] overflow-auto rounded-md border border-[var(--border)] bg-[var(--card)] p-3 text-sm">
              {card.answer}
            </div>
            <div className="mt-3 text-xs text-[var(--muted-foreground)]">
              Click edges or press Space to flip ←
            </div>
          </div>
        </FlipCard>
      </div>

      {/* Tags */}
      {!!card.tags?.length && (
        <div className="flex flex-wrap justify-center gap-2">
          {card.tags.map((t) => (
            <span
              key={`${card.id}-${t}`}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--foreground)]/80"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <button
          type="button"
          onClick={gotoPrev}
          disabled={atStart}
          className={`rounded-md border border-[var(--border)] px-3 py-1.5 text-sm ${
            atStart ? 'cursor-not-allowed opacity-50' : 'hover:opacity-90'
          }`}
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={flip}
          className="rounded-md bg-[var(--primary)] px-4 py-1.5 text-sm text-[var(--primary-foreground)] hover:opacity-90"
        >
          Flip (Space)
        </button>
        <button
          type="button"
          onClick={gotoNext}
          disabled={atEnd}
          className={`rounded-md border border-[var(--border)] px-3 py-1.5 text-sm ${
            atEnd ? 'cursor-not-allowed opacity-50' : 'hover:opacity-90'
          }`}
        >
          Next →
        </button>
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
        className={`relative h-[300px] w-full rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] transition-transform duration-500 [transform-style:preserve-3d] ${
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
