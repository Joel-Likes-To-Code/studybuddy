// app/api/cards/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt, answer, tags } = await req.json() as {
    prompt: string; answer: string; tags?: string[];
  };

  // Minimal validation
  if (!prompt || !answer) {
    return NextResponse.json({ error: "Prompt and answer are required" }, { status: 400 });
  }

  const created = await prisma.card.create({
    data: {
      prompt,
      answer,
      tags: tags ?? [],
      userId: session.user.id,
      // you can also set "type", defaults, etc., as needed
    },
    select: {
      id: true,
      prompt: true,
      answer: true,
      tags: true,
      createdAt: true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
