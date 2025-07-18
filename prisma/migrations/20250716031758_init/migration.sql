-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PEMBIMBING', 'SATPAM', 'PESERTA_MAGANG');

-- CreateEnum
CREATE TYPE "StatusKehadiran" AS ENUM ('HADIR', 'IZIN', 'SAKIT', 'ALPHA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "Role" NOT NULL,
    "fotoProfil" TEXT,
    "nomorTelepon" TEXT,
    "asalInstansi" TEXT,
    "googleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PesertaMagang" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pembimbingId" TEXT,
    "qrCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PesertaMagang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pembimbing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pembimbing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Satpam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Satpam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IzinSatpam" (
    "id" TEXT NOT NULL,
    "pembimbingId" TEXT NOT NULL,
    "satpamId" TEXT NOT NULL,
    "pesertaMagangId" TEXT NOT NULL,
    "diizinkan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IzinSatpam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kehadiran" (
    "id" TEXT NOT NULL,
    "pesertaMagangId" TEXT NOT NULL,
    "status" "StatusKehadiran" NOT NULL,
    "waktuMasuk" TIMESTAMP(3),
    "waktuPulang" TIMESTAMP(3),
    "qrCodeMasuk" TEXT,
    "qrCodePulang" TEXT,
    "validatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kehadiran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "creatorRole" "Role" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "forRole" "Role",
    "pesertaMagangId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PesertaMagang_userId_key" ON "PesertaMagang"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PesertaMagang_qrCode_key" ON "PesertaMagang"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "Pembimbing_userId_key" ON "Pembimbing"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Satpam_userId_key" ON "Satpam"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_code_key" ON "QRCode"("code");

-- AddForeignKey
ALTER TABLE "PesertaMagang" ADD CONSTRAINT "PesertaMagang_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PesertaMagang" ADD CONSTRAINT "PesertaMagang_pembimbingId_fkey" FOREIGN KEY ("pembimbingId") REFERENCES "Pembimbing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pembimbing" ADD CONSTRAINT "Pembimbing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Satpam" ADD CONSTRAINT "Satpam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IzinSatpam" ADD CONSTRAINT "IzinSatpam_pembimbingId_fkey" FOREIGN KEY ("pembimbingId") REFERENCES "Pembimbing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IzinSatpam" ADD CONSTRAINT "IzinSatpam_satpamId_fkey" FOREIGN KEY ("satpamId") REFERENCES "Satpam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IzinSatpam" ADD CONSTRAINT "IzinSatpam_pesertaMagangId_fkey" FOREIGN KEY ("pesertaMagangId") REFERENCES "PesertaMagang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kehadiran" ADD CONSTRAINT "Kehadiran_pesertaMagangId_fkey" FOREIGN KEY ("pesertaMagangId") REFERENCES "PesertaMagang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
