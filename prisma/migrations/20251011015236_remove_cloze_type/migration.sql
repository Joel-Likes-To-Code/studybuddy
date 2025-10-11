/*
  Warnings:

  - You are about to drop the column `type` on the `Card` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Card" DROP COLUMN "type";

-- DropEnum
DROP TYPE "public"."CardType";
