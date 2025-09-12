import { prisma } from "@/lib/prisma";

export default async function TestPage() {
  const users = await prisma.user.findMany();
  return (
    <main className="p-6">
      <h1>Users</h1>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </main>
  );
}
