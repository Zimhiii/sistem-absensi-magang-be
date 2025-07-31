-- CreateEnum
CREATE TYPE "TimeType" AS ENUM ('MASUK', 'PULANG');

-- AlterTable
ALTER TABLE "QRCode" ADD COLUMN     "timeType" "TimeType";
