"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import type { Card, CardDTO, NewCardInput } from "@/src/lib/types/card";

const NewCardSchema = z.object({
  prompt: z.string().min(1),
  answer: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

const UpdateCardSchema = z.object({
  prompt: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Converts a Prisma `Card` model into a lightweight `CardDTO`
 * that can be safely returned to the client.
 *
 * @param card - The Prisma Card object retrieved from the database.
 * @returns A simplified CardDTO containing only client-relevant fields.
 **/
function toDTO(card: Card): CardDTO {
  return {
    id: card.id,
    prompt: card.prompt,
    answer: card.answer,
    tags: card.tags ?? [],
    createdAt: card.createdAt,
  };
}

/**
 * Ensures the current session has an authenticated user
 * and returns their user ID for authorization checks.
 *
 * @returns The authenticated user's ID.
 * @throws Error if no valid session or user is found.
 **/
async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

/**
 * Creates a new flashcard for the authenticated user.
 * Validates the input, associates it with the user, and saves it to the database.
 *
 * @param input - The new card data including prompt, answer, and tags.
 * @returns The created CardDTO object for immediate client rendering.
 **/
export async function createCard(input: NewCardInput): Promise<CardDTO> {
  const userId = await requireUserId();
  const data = NewCardSchema.parse(input);

  const created = await prisma.card.create({
    data: {
      userId,
      prompt: data.prompt,
      answer: data.answer,
      tags: data.tags,
    },
  });

  revalidatePath("/dashboard");
  return toDTO(created);
}

/**
 * Updates an existing flashcard owned by the authenticated user.
 * Performs validation and ownership checks before applying updates.
 *
 * @param id - The ID of the card to update.
 * @param patch - Partial card data (prompt, answer, tags) to modify.
 * @returns The updated CardDTO object.
 * @throws Error if the card does not exist or user is unauthorized.
 **/
export async function updateCard(id: string, patch: Partial<CardDTO>): Promise<CardDTO> {
  const userId = await requireUserId();
  const data = UpdateCardSchema.parse({
    prompt: patch.prompt,
    answer: patch.answer,
    tags: patch.tags,
  });

  const existing = await prisma.card.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Not found");

  const updated = await prisma.card.update({
    where: { id },
    data: {
      prompt: data.prompt,
      answer: data.answer,
      tags: data.tags,
    },
  });

  revalidatePath("/dashboard");
  return toDTO(updated);
}

/**
 * Deletes a flashcard owned by the authenticated user.
 * Ensures the card exists and belongs to the current user before deletion.
 *
 * @param id - The ID of the card to delete.
 * @returns An object containing the deleted card's ID.
 * @throws Error if the card is not found or unauthorized access occurs.
 **/
export async function deleteCard(id: string): Promise<{ id: string }> {
  const userId = await requireUserId();
  const existing = await prisma.card.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Not found");

  await prisma.card.delete({ where: { id } });
  revalidatePath("/dashboard");
  return { id };
}

/**
 * Retrieves all cards belonging to the authenticated user.
 * Returns the results sorted by creation date (most recent first).
 *
 * @returns An array of CardDTO objects for the current user.
 * @throws Error if the user is not authenticated.
 **/
export async function listCards(): Promise<CardDTO[]> {
  const userId = await requireUserId();
  const cards = await prisma.card.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return cards.map(toDTO);
}