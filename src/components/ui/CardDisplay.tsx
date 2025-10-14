"use client";

import React from "react";
import { useEffect, useRef, useState } from "react";
import { CardDTO } from "@/src/lib/types/card";


type CardDisplayProps = {
  cards: CardDTO[];
  className?: string;
  limit?: number;
  onEdit?: (card: CardDTO) => void;
  onDelete?: (card: CardDTO) => void;
};

export default function CardDisplay({
  cards,
  className,
  limit = 10,
  onEdit,
  onDelete,
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
      if (e.key === "Escape") setOpenMenuId(null);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <section className={["space-y-3", className].filter(Boolean).join(" ")}>
      <h2 className="text-xl font-semibold">Your cards</h2>

      {visibleCards.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No cards yet.</p>
      ) : (
        <ul className="grid gap-3">
          {visibleCards.map((c) => {
            const isOpen = openMenuId === c.id;
            return (
              <li
                key={c.id}
                className="group relative rounded-md border border-[var(--border)] p-3 bg-[var(--card)]"
              >
                {/* Kebab button (hidden until hover/focus) */}
                <div className="absolute right-2 top-2">
                  <button
                    type="button"
                    aria-label="Card actions"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    onClick={() => setOpenMenuId(isOpen ? null : c.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenMenuId(isOpen ? null : c.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded p-1 hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    {/* vertical ellipsis */}
                    <span className="text-lg leading-none select-none">⋮</span>
                  </button>
                </div>

                {/* Card content */}
                <div className="pr-8">
                  <div className="text-sm font-medium">{c.prompt}</div>
                  <div className="text-sm opacity-80 mt-1">{c.answer}</div>

                  {c.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <span
                          key={`${c.id}-${t}`}
                          className="px-2 py-0.5 text-xs rounded-full bg-[var(--muted)]"
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
                    className="absolute right-2 top-9 z-20 w-40 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] shadow-lg"
                  >
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        onEdit?.(c);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
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
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50/60 dark:hover:bg-red-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
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
