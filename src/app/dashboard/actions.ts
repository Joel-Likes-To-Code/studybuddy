// // app/dashboard/actions.ts
// "use server";

// import { auth } from "@/auth";
// import {prisma} from '@/src/lib/prisma'
// import { z } from "zod";

// export type CardDTO = {
//   id: string;
//   prompt: string;
//   answer: string;
//   tags: string[];
//   createdAt: string; // ISO for client
//   type: string;      // adjust to your enum if desired
//   suspended: boolean;
// };

// const FilterSchema = z.object({
//   q: z.string().trim().optional(),           // text search on prompt/answer
//   tag: z.string().trim().optional(),         // single tag filter (expand if needed)
//   type: z.string().trim().optional(),        // CardType if you want to filter it
//   includeSuspended: z.boolean().default(true),
//   limit: z.number().int().min(1).max(100).default(20),
//   offset: z.number().int().min(0).default(0),
// });

// export async function searchCards(raw: unknown): Promise<CardDTO[]> {
//   const session = await auth();
//   if (!session?.user?.id) throw new Error("Unauthorized");
//   const { q, tag, type, includeSuspended, limit, offset } = FilterSchema.parse(raw);

//   const where = {
//     userId: session.user.id,
//     ...(includeSuspended ? {} : { suspended: false }),
//     ...(type ? { type } : {}),
//     ...(q
//       ? { OR: [{ prompt: { contains: q, mode: "insensitive" } }, { answer: { contains: q, mode: "insensitive" } }] }
//       : {}),
//     ...(tag ? { tags: { has: tag } } : {}),
//   };

//   const rows = await prisma.card.findMany({
//     where,
//     orderBy: { createdAt: "desc" },
//     take: limit,
//     skip: offset,
//     select: {
//       id: true,
//       prompt: true,
//       answer: true,
//       tags: true,
//       createdAt: true,
//       type: true,
//       suspended: true,
//     },
//   });

//   return rows.map((r) => ({
//     ...r,
//     createdAt: r.createdAt.toISOString(),
//     type: String(r.type),
//   }));
// }
