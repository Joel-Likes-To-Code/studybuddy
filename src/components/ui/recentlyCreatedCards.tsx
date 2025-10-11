// app/components/RecentlyCreatedCards.tsx (Server Component)
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";

export default async function RecentlyCreatedCards({ limit = 5 }: { limit?: number }) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const cards = await prisma.card.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      prompt: true,
      answer: true,
      tags: true,
      createdAt: true,
      type: true,
      suspended: true,
    },
  });

  return (
    <aside className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Recently created</h2>
        {/* Optional: button to open your modal */}
        {/* <button className="text-xs underline" formAction={openModalAction}>View all</button> */}
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No cards yet.</p>
      ) : (
        <ul className="space-y-2">
          {cards.map((c) => (
            <li key={c.id} className="rounded border border-[var(--border)] p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="font-medium">{c.prompt}</div>
                <span className="text-[10px] uppercase tracking-wide opacity-60">
                  {String(c.type)}{c.suspended ? " · Suspended" : ""}
                </span>
              </div>
              <div className="text-sm opacity-80 line-clamp-2">{c.answer}</div>
              {!!c.tags.length && (
                <div className="mt-1 text-xs opacity-70">Tags: {c.tags.join(", ")}</div>
              )}
              <time
                className="mt-1 block text-[10px] opacity-60"
                dateTime={c.createdAt.toISOString()}
                title={c.createdAt.toISOString()}
              >
                Created {c.createdAt.toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
