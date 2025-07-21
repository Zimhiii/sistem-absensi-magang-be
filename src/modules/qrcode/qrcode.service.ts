import { Role } from "@prisma/client";
import prisma from "../../config/prisma";
import { generateQRCodeByData } from "../../utils/qrGenerator";

class QRCodeService {
  async generateQRCode(
    userId: string,
    expiresInMinutes: number,
    forRole?: Role,
    pesertaMagangId?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error("User tidak ditemukan");

    if (
      user.role !== "ADMIN" &&
      user.role !== "PEMBIMBING" &&
      user.role !== "SATPAM"
    ) {
      throw new Error("Anda tidak memiliki izin untuk membuat QR code");
    }

    if (user.role === "SATPAM" && pesertaMagangId) {
      const satpam = await prisma.satpam.findUnique({
        where: { userId: user.id },
      });

      if (!satpam) throw new Error("Data satpam tidak ditemukan");

      const hasPermission = await prisma.izinSatpam.findFirst({
        where: {
          satpamId: satpam.id,
          pesertaMagangId,
          diizinkan: true,
        },
      });

      if (!hasPermission) {
        throw new Error(
          "Anda tidak memiliki izin dari pembimbing untuk membuat QR code untuk peserta magang ini"
        );
      }
    }

    const code = `TELKOM-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const qrCode = await prisma.qRCode.create({
      data: {
        code,
        creatorId: userId,
        creatorRole: user.role,
        expiresAt,
        forRole: forRole as Role | undefined,
        pesertaMagangId,
      },
    });

    const qrCodeImage = await generateQRCodeByData(code);

    return {
      id: qrCode.id,
      code: qrCode.code,
      qrCodeImage,
      expiresAt: qrCode.expiresAt,
    };
  }

  async getMyQRCode(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pesertaMagang: true },
    });

    if (!user || !user.pesertaMagang) {
      throw new Error("Hanya peserta magang yang memiliki QR code permanen");
    }

    const qrCodeImage = await generateQRCodeByData(user.pesertaMagang.qrCode);

    return {
      qrCode: user.pesertaMagang.qrCode,
      qrCodeImage,
    };
  }

  async getGenerateQRCodes(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error("User tidak ditemukan");

    const qrCodes = await prisma.qRCode.findMany({
      where: {
        creatorId: userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        expiresAt: "asc",
      },
    });

    const qrCodesWithImages = await Promise.all(
      qrCodes.map(async (qr) => ({
        id: qr.id,
        code: qr.code,
        qrCodeImage: await generateQRCodeByData(qr.code),
        expiresAt: qr.expiresAt,
        forRole: qr.forRole,
        pesertaMagangId: qr.pesertaMagangId,
      }))
    );

    return qrCodesWithImages;
  }
}

export default new QRCodeService();
