'use client';

import { CardDTO } from '@/src/lib/types/card';
import { useEffect, useRef, useState } from 'react';

type CardDisplayProps = {
  cards: CardDTO[];
  className?: string;
  limit?: number;
  onEdit?: (card: CardDTO) => void;
  onDelete?: (card: CardDTO) => void;
  onView?: (card: CardDTO) => void;
};

export default function CardDisplay({
  cards,
  className,
  limit = 10,
  onEdit,
  onDelete,
  onView,
}: CardDisplayProps) {
  const visibleCards = cards.slice(0, limit);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu on outside click or Escape
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenMenuId(null);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <section className={['space-y-3', className].filter(Boolean).join(' ')}>
      {visibleCards.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No cards yet.</p>
      ) : (
        <ul className="grid gap-3">
          {visibleCards.map((c) => {
            const isOpen = openMenuId === c.id;
            return (
              <li
                key={c.id}
                className="group relative rounded-md border border-[var(--border)] bg-[var(--card)] p-3"
                onClick={() => onView?.(c)}
              >
                {/* Kebab button (hidden until hover/focus) */}
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    aria-label="Card actions"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isOpen ? null : c.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpenMenuId(isOpen ? null : c.id);
                      }
                    }}
                    className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--muted)] focus:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
                  >
                    <span className="text-lg leading-none select-none">⋮</span>
                  </button>
                </div>
                {/* Card content */}
                <div className="pr-8">
                  <div className="text-sm font-medium">{c.prompt}</div>

                  {c.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {c.tags.map((t) => (
                        <span
                          key={`${c.id}-${t}`}
                          className={[
                            'inline-flex items-center',
                            'rounded-full border border-[var(--border)]',
                            'bg-[var(--muted)]/70 text-[var(--foreground)]/90',
                            'px-3 py-1 text-xs font-medium',
                            'transition-colors',
                            'hover:bg-[var(--muted)]',
                          ].join(' ')}
                          title={t}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                {/* Context menu (positioned near kebab) */}
                {isOpen && (
                  <div
                    ref={menuRef}
                    role="menu"
                    aria-label="Card actions"
                    className="absolute top-9 right-2 z-20 w-40 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        onEdit?.(c);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
                    >
                      Edit
                    </button>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        onDelete?.(c);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50/60 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none dark:hover:bg-red-950/30"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
