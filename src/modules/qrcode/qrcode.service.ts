// import { Role } from "@prisma/client};
import { get } from "http";
import prisma from "../../config/prisma.js";
import { generateQRCodeByData } from "../../utils/qrGenerator.js";
import { getWIBDate, getWIBStartOfDay } from "../../utils/helpers.js";
import { time } from "console";

class QRCodeService {
  async generateQRCode(
    userId: string,
    expiresInMinutes: number,
    forRole?: "ADMIN" | "PEMBIMBING" | "SATPAM" | "PESERTA_MAGANG",
    pesertaMagangId?: string,
    baseDate?: string, // Tambahkan parameter untuk tanggal dari frontend
    timeType?: "MASUK" | "PULANG" | null // Tambahkan parameter untuk tipe waktu
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

    // Validasi expiresInMinutes
    if (!expiresInMinutes || isNaN(expiresInMinutes) || expiresInMinutes <= 0) {
      throw new Error("Waktu kadaluarsa harus berupa angka positif");
    }

    // if (user.role === "SATPAM" && pesertaMagangId) {
    //   const satpam = await prisma.satpam.findUnique({
    //     where: { userId: user.id },
    //   });

    //   if (!satpam) throw new Error("Data satpam tidak ditemukan");

    //   const hasPermission = await prisma.izinSatpam.findFirst({
    //     where: {
    //       satpamId: satpam.id,
    //       pesertaMagangId,
    //       diizinkan: true,
    //     },
    //   });

    //   if (!hasPermission) {
    //     throw new Error(
    //       "Anda tidak memiliki izin dari pembimbing untuk membuat QR code untuk peserta magang ini"
    //     );
    //   }
    // }

    const code = `TELKOM-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Gunakan tanggal dari frontend jika ada, atau waktu server jika tidak ada
    let currentTime: Date;

    if (baseDate) {
      currentTime = new Date(baseDate);
      console.log("Using date from frontend:", baseDate);
    } else {
      // Fallback ke waktu server dalam WIB
      const now = new Date();
      currentTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
      );
      console.log("Using server time in WIB");
    }

    const expiresAt = new Date(
      currentTime.getTime() + expiresInMinutes * 60 * 1000
    );

    // Format ke bahasa Indonesia
    // const indonesianFormat = date.toLocaleString("id-ID", {
    //   timeZone: "Asia/Jakarta",
    //   year: "numeric",
    //   month: "long",
    //   day: "numeric",
    //   hour: "2-digit",
    //   minute: "2-digit",
    //   second: "2-digit",
    // });
    // console.log(indonesianFormat); // "31 Juli 2025 15.17.31"

    // // Format custom
    // const customFormat = date.toLocaleString("id-ID", {
    //   timeZone: "Asia/Jakarta",
    //   day: "2-digit",
    //   month: "2-digit",
    //   year: "numeric",
    //   hour: "2-digit",
    //   minute: "2-digit",
    // });
    // console.log(customFormat); // "31/07/2025 15.17"
    const now = new Date(baseDate as string);
    now.setHours(now.getHours() + 7); // Tambahkan 7 jam untuk WIB
    const today = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    // today.setHours(0, 0, 0, 0); // Set waktu ke awal hari
    // Tambahkan 7 jam untuk WIB
    const expiresAtTime = new Date(
      now.getTime() + expiresInMinutes * 60 * 1000
    );

    console.log("Current time (used):", now);
    console.log("Expires at (used):", expiresAtTime);

    const qrCode = await prisma.qRCode.create({
      data: {
        code,
        creatorId: userId,
        creatorRole: user.role,
        expiresAt: expiresAtTime,
        forRole: forRole as
          | "ADMIN"
          | "PEMBIMBING"
          | "SATPAM"
          | "PESERTA_MAGANG"
          | undefined,
        pesertaMagangId,
        createdAt: now, // Gunakan tanggal dari frontend atau waktu server
        timeType: timeType || null, // Tambahkan tipe waktu jika diperlukan
      },
    });

    const qrCodeImage = await generateQRCodeByData(code);

    return {
      id: qrCode.id,
      code: qrCode.code,
      qrCodeImage,
      expiresAt: qrCode.expiresAt,
      now, // Return waktu yang digunakan
    };
  }

  // async getGenerateQRCodes(userId: string) {
  //   const user = await prisma.user.findUnique({
  //     where: { id: userId },
  //   });

  //   if (!user) throw new Error("User tidak ditemukan");

  //   // Gunakan Date biasa untuk perbandingan
  //   const now = new Date();

  //   const qrCodes = await prisma.qRCode.findMany({
  //     where: {
  //       creatorId: userId,
  //       expiresAt: { gt: now },
  //     },
  //     orderBy: {
  //       expiresAt: "asc",
  //     },
  //   });

  //   // ...existing code...
  // }

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
    // const user = await prisma.user.findUnique({
    //   where: { id: userId },
    // });

    // const now = getWIBStartOfDay();

    // if (!user) throw new Error("User tidak ditemukan");
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    console.log("User ID:", user);

    if (!user) throw new Error("User tidak ditemukan");

    // Gunakan Date biasa untuk perbandingan
    const now = new Date();

    const qrCodes = await prisma.qRCode.findMany({
      where: {
        creatorId: userId,
        // expiresAt: { gt: now },
        createdAt: {
          gte: getWIBStartOfDay(), // Menggunakan fungsi helper untuk mendapatkan awal hari WIB
        },
      },
      orderBy: {
        expiresAt: "asc",
      },
    });

    console.log("Current time (used):", now);
    console.log("qrCode:", qrCodes);

    // const qrCodes = await prisma.qRCode.findMany({
    //   where: {
    //     creatorId: userId,
    //     expiresAt: { gt: now },
    //   },
    //   orderBy: {
    //     expiresAt: "asc",
    //   },
    // });

    type qrCode = {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      code: string;
      timeType: "MASUK" | "PULANG" | null; // Tambahkan tipe waktu jika diperlukan
      creatorId: string;
      creatorRole: "ADMIN" | "PEMBIMBING" | "SATPAM" | "PESERTA_MAGANG";
      expiresAt: Date;
      forRole: "ADMIN" | "PEMBIMBING" | "SATPAM" | "PESERTA_MAGANG" | null;
      pesertaMagangId: string | null;
    };

    const qrCodesWithImages = await Promise.all(
      qrCodes.map(async (qr: qrCode) => ({
        id: qr.id,
        code: qr.code,
        createdAt: qr.createdAt,
        qrCodeImage: await generateQRCodeByData(qr.code),
        expiresAt: qr.expiresAt,
        forRole: qr.forRole,
        pesertaMagangId: qr.pesertaMagangId,
        timeType: qr.timeType, // Tambahkan timeType jika diperlukan
      }))
    );

    console.log("qrCodesWithImages:", qrCodesWithImages);

    return qrCodesWithImages;
  }
}

export default new QRCodeService();
