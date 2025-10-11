// Server Component
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import DashboardClient from "@/src/components/ui/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
        <p>Please sign in to view your cards.</p>
      </main>
    );
  }

  const cards = await prisma.card.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, prompt: true, answer: true, tags: true, createdAt: true },
  });

  return (
    <DashboardClient
      userName={session.user.name ?? session.user.email ?? "You"}
      initialCards={cards}
    />
  );
}
