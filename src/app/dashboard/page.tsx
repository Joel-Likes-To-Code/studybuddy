"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Notebook = {
  id: string;
  title: string;
  updatedAt: string; // ISO
};

export default function DashboardPage() {
  const [notebooks, setNotebooks] = useState<Notebook[] | null>(null);

  useEffect(() => {
    setNotebooks([
      {
        id: crypto.randomUUID(),
        title: "Biology 101",
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: "Discrete Math",
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: "Cognitive Science",
        updatedAt: new Date().toISOString(),
      },
    ]);
  }, []);

  // UI state
  const [newTitle, setNewTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const anySelected = useMemo(
    () => Object.values(selected).some(Boolean),
    [selected]
  );

  // Handlers
  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const now = new Date().toISOString();
    setNotebooks((prev) =>
      (prev ?? []).length === 0
        ? [{ id: crypto.randomUUID(), title, updatedAt: now }]
        : [{ id: crypto.randomUUID(), title, updatedAt: now }, ...(prev as Notebook[])]
    );
    setNewTitle("");
  }

  function toggleEdit() {
    setIsEditing((v) => !v);
    setSelected({});
  }

  function toggleSelect(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function selectAll() {
    if (!notebooks) return;
    const allSelected = notebooks.every((n) => selected[n.id]);
    if (allSelected) {
      setSelected({});
    } else {
      const next: Record<string, boolean> = {};
      notebooks.forEach((n) => (next[n.id] = true));
      setSelected(next);
    }
  }

  function handleBulkDelete() {
    if (!notebooks || !anySelected) return;
    const names = notebooks
      .filter((n) => selected[n.id])
      .map((n) => `"${n.title}"`)
      .join(", ");
    const ok = confirm(
      `Delete the following notebook(s)?\n\n${names}\n\nThis cannot be undone in mock mode.`
    );
    if (!ok) return;
    setNotebooks(notebooks.filter((n) => !selected[n.id]));
    setSelected({});
  }

  //Skeleton while notebooks === null
  if (notebooks === null) {
    return (
      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="h-8 w-56 bg-gray-100 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-20 bg-gray-100 rounded animate-pulse" />
        </div>
      </main>
    );
  }

  //Render
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your Notebooks</h1>
          <p className="text-sm text-gray-500">
            Create, open, or bulk delete notebooks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleEdit}
            className="px-3 py-2 rounded border"
            aria-pressed={isEditing}
          >
            {isEditing ? "Done" : "Edit"}
          </button>

          {isEditing && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 rounded border border-red-500 text-red-600 disabled:opacity-50"
              disabled={!anySelected}
              title={anySelected ? "Delete selected" : "Select items to delete"}
            >
              Delete Selected
            </button>
          )}
        </div>
      </header>

      {/* Create Notebook */}
      <form onSubmit={handleCreate} className="flex items-center gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New notebook name"
          className="border rounded px-3 py-2 w-full sm:w-80"
          aria-label="Notebook name"
        />
        <button className="px-3 py-2 rounded bg-black text-white">
          Create
        </button>
      </form>

      {/* Toolbar (only in edit mode) */}
      {isEditing && notebooks.length > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <button type="button" onClick={selectAll} className="px-2 py-1 rounded border">
            {notebooks.every((n) => selected[n.id]) ? "Clear All" : "Select All"}
          </button>
          <span className="text-gray-600">
            {Object.values(selected).filter(Boolean).length} selected
          </span>
        </div>
      )}

      {/* Scrollable list */}
      <section className="border rounded-lg" aria-label="Notebooks list">
        <div className="max-h-[520px] overflow-auto">
          <ul className="divide-y">
            {notebooks.map((n) => {
              const isChecked = !!selected[n.id];
              return (
                <li key={n.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                  {isEditing && (
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={isChecked}
                      onChange={() => toggleSelect(n.id)}
                      aria-label={`Select ${n.title}`}
                    />
                  )}

                  {/* Clickable area to open notebook */}
                  <Link href={`/notebook/${n.id}`} className="flex-1 min-w-0">
                    <div className="font-medium truncate">{n.title}</div>
                    <div className="text-xs text-gray-500">
                      Updated {new Date(n.updatedAt).toLocaleString()}
                    </div>
                  </Link>

                  {!isEditing && (
                    <Link
                      href={`/notebook/${n.id}`}
                      className="px-2 py-1 rounded border text-sm"
                    >
                      Open
                    </Link>
                  )}
                </li>
              );
            })}
            {notebooks.length === 0 && (
              <li className="p-6 text-sm text-center text-gray-500">
                No notebooks yet. Create your first one above.
              </li>
            )}
          </ul>
        </div>
      </section>
    </main>
  );
}
