/*
  Warnings:

  - You are about to drop the column `sourceEmail` on the `Ticket` table. All the data in the column will be lost.
  - Added the required column `senderEmail` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderName` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "sourceEmail",
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "senderEmail" TEXT NOT NULL,
ADD COLUMN     "senderName" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
