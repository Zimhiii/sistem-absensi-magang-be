/*
  Warnings:

  - You are about to drop the column `satpamId` on the `IzinSatpam` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pembimbingId,pesertaMagangId]` on the table `IzinSatpam` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "IzinSatpam" DROP CONSTRAINT "IzinSatpam_satpamId_fkey";

-- AlterTable
ALTER TABLE "IzinSatpam" DROP COLUMN "satpamId";

-- CreateIndex
CREATE UNIQUE INDEX "IzinSatpam_pembimbingId_pesertaMagangId_key" ON "IzinSatpam"("pembimbingId", "pesertaMagangId");
