-- CreateEnum
CREATE TYPE "validasiStatus" AS ENUM ('APPROVED', 'REJECTED', 'PENDING');

-- AlterTable
ALTER TABLE "Kehadiran" ADD COLUMN     "alasan" TEXT,
ADD COLUMN     "validasiAt" TIMESTAMP(3),
ADD COLUMN     "validasiStatus" "validasiStatus";
