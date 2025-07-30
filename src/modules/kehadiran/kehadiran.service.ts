// import { $ } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { generateExcel } from "../../utils/helpers.js";

class kehadiranService {
  async recordAttendance(
    userId: string,
    qrCode: string,
    type: "MASUK" | "PULANG"
  ) {
    const now = new Date();
    const today = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pesertaMagang: true },
    });

    if (!user || !user.pesertaMagang) {
      throw new Error("Hanya peserta magang yang dapat melakukan kehadiran");
    }

    const validQR = await prisma.qRCode.findFirst({
      where: {
        code: qrCode,
        expiresAt: {
          gt: new Date(),
        },
        OR: [
          {
            forRole: null,
          },
          {
            forRole: "PESERTA_MAGANG",
          },
        ],
      },
    });

    if (!validQR) {
      throw new Error("QR code tidak valid atau sudah kadaluarsa");
    }
    // Menjadi:

    const existingAttendance = await prisma.kehadiran.findFirst({
      where: {
        pesertaMagangId: user.pesertaMagang.id,
        createdAt: { gte: today },
      },
    });

    if (type === "MASUK") {
      if (existingAttendance && existingAttendance.waktuMasuk) {
        throw new Error("Anda sudah melakukan absen masuk hari ini");
      }

      if (existingAttendance) {
        return prisma.kehadiran.update({
          where: {
            id: existingAttendance.id,
          },
          data: {
            status: "HADIR",
            waktuMasuk: today,
            qrCodeMasuk: qrCode,
          },
        });
      } else {
        return prisma.kehadiran.create({
          data: {
            pesertaMagangId: user.pesertaMagang.id,
            status: "HADIR",
            waktuMasuk: today,
            qrCodeMasuk: qrCode,
          },
        });
      }
    } else if (type === "PULANG") {
      if (!existingAttendance) {
        throw new Error("Anda belum melakukan absen masuk hari ini");
      }
      if (!existingAttendance.waktuPulang) {
        throw new Error("Anda belum melakukan absen pulang hari ini");
      }

      return prisma.kehadiran.update({
        where: { id: existingAttendance.id },
        data: {
          waktuPulang: today,
          qrCodePulang: qrCode,
        },
      });
    } else {
      throw new Error("Tipe kehadiran tidak valid");
    }
  }

  async scanAttendace(
    scannerId: string,
    qrCode: string,
    type: "MASUK" | "PULANG"
  ) {
    const scanner = await prisma.user.findUnique({
      where: { id: scannerId },
      include: {
        pembimbing: true,
        satpam: true,
      },
    });

    if (!scanner) {
      throw new Error("User tidak ditemukan");
    }

    const pesertaMagang = await prisma.pesertaMagang.findUnique({
      where: { qrCode },
      include: { user: true },
    });

    if (!pesertaMagang) {
      throw new Error("QR code peserta magang tidak valid");
    }

    if (scanner.role === "SATPAM" && scanner.satpam) {
      const hasPermission = await prisma.izinSatpam.findFirst({
        where: {
          satpamId: scanner.satpam.id,
          pesertaMagangId: pesertaMagang.id,
          diizinkan: true,
        },
      });

      if (!hasPermission) {
        throw new Error(
          "Satpam tidak memiliki izin untuk memindai peserta magang ini"
        );
      }
    }

    if (scanner.role === "PEMBIMBING" && scanner.pembimbing) {
      if (pesertaMagang.pembimbingId !== scanner.pembimbing.id) {
        throw new Error(
          "Pembimbing tidak memiliki izin untuk memindai peserta magang ini"
        );
      }
    }

    const now = new Date();
    const todayWithTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    const today = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.kehadiran.findFirst({
      where: {
        pesertaMagangId: pesertaMagang.id,
        createdAt: { gte: today },
      },
    });

    if (type === "MASUK") {
      if (existingAttendance && existingAttendance.waktuMasuk) {
        throw new Error("Peserta magang sudah melakukan absen masuk hari ini");
      }

      if (existingAttendance) {
        return prisma.kehadiran.update({
          where: {
            id: existingAttendance.id,
          },
          data: {
            status: "HADIR",
            waktuMasuk: today,
            validatedBy: scannerId,
          },
        });
      } else {
        return prisma.kehadiran.create({
          data: {
            pesertaMagangId: pesertaMagang.id,
            status: "HADIR",
            waktuMasuk: todayWithTime,
            validatedBy: scannerId,
          },
        });
      }
    } else if (type === "PULANG") {
      if (!existingAttendance) {
        throw new Error("Peserta magang belum melakukan absen masuk hari ini");
      }

      return prisma.kehadiran.update({
        where: { id: existingAttendance.id },
        data: {
          waktuPulang: todayWithTime,
          validatedBy: scannerId,
        },
      });
    } else {
      throw new Error("Type kehadiran tidak valid");
    }
  }

  async getAttendanceHistory(
    userId: string,
    startDate?: string,
    endDate?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pesertaMagang: true, pembimbing: true },
    });

    if (!user) throw new Error("User tidak ditemukan");

    let whereClause: any = {};
    let pesertaMagangId: string | string[] | undefined;

    if (user.role === "PESERTA_MAGANG" && user.pesertaMagang) {
      pesertaMagangId = user.pesertaMagang.id;
      whereClause.pesertaMagangId = pesertaMagangId;
    } else if (user.role === "PEMBIMBING" && user.pembimbing) {
      const pesertaMagang = await prisma.pesertaMagang.findMany({
        where: { pembimbingId: user.pembimbing.id },
      });
      pesertaMagangId = pesertaMagang.map(
        (pm: {
          id: string;
          createdAt: Date;
          updatedAt: Date;
          userId: string;
          pembimbingId: string | null;
          qrCode: string;
        }) => pm.id
      );
      whereClause.pesertaMagangId = { in: pesertaMagangId };
    } else if (user.role === "ADMIN") {
      //tidak perlu filter peserta magang id
    } else {
      throw new Error("Anda tidak memiliki akses ke data kehadiran");
    }

    if (startDate) {
      whereClause.createdAt = { gte: new Date(startDate) };
    }
    if (endDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: new Date(endDate),
      };
    }

    const history = await prisma.kehadiran.findMany({
      where: whereClause,
      include: {
        pesertaMagang: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
                fotoProfil: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return history;
  }

  async requestIzin(
    userId: string,
    alasan: string,
    tanggal: string,
    jenis: "IZIN" | "SAKIT"
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pesertaMagang: true },
    });

    if (!user || !user.pesertaMagang) {
      throw new Error("Hanya peserta magang yang dapat mengajukan izin");
    }

    const date = new Date(tanggal);
    date.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.kehadiran.findFirst({
      where: {
        pesertaMagangId: user.pesertaMagang.id,
        createdAt: {
          gte: date,
        },
      },
    });
    if (existingAttendance) {
      throw new Error(
        "Anda sudah memiliki record kehadiran pada tanggal tersebut"
      );
    }

    return prisma.kehadiran.create({
      data: {
        pesertaMagangId: user.pesertaMagang.id,
        status: jenis === "IZIN" ? "IZIN" : "SAKIT",
      },
    });
  }

  async validateIzin(
    validatorId: string,
    izinId: string,
    status: "APPROVED" | "REJECTED"
  ) {
    const validator = await prisma.user.findUnique({
      where: {
        id: validatorId,
      },
    });

    if (
      !validator ||
      (validator.role !== "PEMBIMBING" && validator.role !== "ADMIN")
    ) {
      throw new Error(
        "Hanya pembimbing atau admin yang dapat memvalidasi izin"
      );
    }

    const izin = await prisma.kehadiran.findUnique({
      where: { id: izinId },
      include: {
        pesertaMagang: {
          include: {
            pembimbing: true,
          },
        },
      },
    });

    if (!izin) throw new Error("Izin tidak ditemukan");

    if (
      validator.role === "PEMBIMBING" &&
      izin.pesertaMagang.pembimbingId !== validator.id
    ) {
      throw new Error("Anda tidak berhak memvalidasi izin peserta magang ini");
    }

    if (status === "APPROVED") {
      return prisma.kehadiran.update({
        where: { id: izinId },
        data: {
          validatedBy: validatorId,
        },
      });
    } else {
      return prisma.kehadiran.delete({
        where: {
          id: izinId,
        },
      });
    }
  }

  async exportAttendance(
    pesertaMagangId: string,
    startDate: string,
    endDate: string
  ) {
    const whereClause: any = {
      pesertaMagangId,
    };

    if (startDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: new Date(endDate),
      };
    }

    const kehadiran = await prisma.kehadiran.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "asc",
      },
    });

    const pesertaMagang = await prisma.pesertaMagang.findUnique({
      where: { id: pesertaMagangId },
      include: {
        user: {
          select: {
            nama: true,
          },
        },
        pembimbing: {
          include: {
            user: {
              select: {
                nama: true,
              },
            },
          },
        },
      },
    });

    if (!pesertaMagang) throw new Error("Peserta magang tidak ditemukan");
    // {
    //   id: string;
    //   pesertaMagangId: string;
    //   status: $Enums.StatusKehadiran;
    //   waktuMasuk: Date | null;
    //   waktuPulang: Date | null;
    //   qrCodeMasuk: string | null;
    //   qrCodePulang: string | null;
    //   validatedBy: string | null;
    //   createdAt: Date;
    //   updatedAt: Date;
    // }
    // Format data untuk Excel
    const data = kehadiran.map(
      (k: {
        id: string;
        pesertaMagangId: string;
        status: "HADIR" | "IZIN" | "SAKIT" | "ALPHA";
        waktuMasuk: Date | null;
        waktuPulang: Date | null;
        qrCodeMasuk: string | null;
        qrCodePulang: string | null;
        validatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
      }) => ({
        Tanggal: k.createdAt.toISOString().split("T")[0],
        Nama: pesertaMagang.user.nama,
        Pembimbing: pesertaMagang.pembimbing?.user.nama || "-",
        Status: k.status,
        "Waktu Masuk": k.waktuMasuk?.toLocaleTimeString() || "-",
        "Waktu Pulang": k.waktuPulang?.toLocaleTimeString() || "-",
      })
    );

    return generateExcel(data, `Laporan Kehadiran ${pesertaMagang.user.nama}`);
  }
}

export default new kehadiranService();
