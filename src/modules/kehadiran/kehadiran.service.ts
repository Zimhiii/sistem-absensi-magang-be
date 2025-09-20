// import { $ } from "@prisma/client";
import prisma from "../../config/prisma.js";
import {
  generateExcel,
  getWIBDate,
  getWIBStartOfDay,
} from "../../utils/helpers.js";

class kehadiranService {
  async recordAttendance(
    userId: string,
    qrCode: string,
    type: "MASUK" | "PULANG"
  ) {
    console.log(
      `Recording attendance for user ${userId} with QR code ${qrCode} and type ${type}`
    );
    const now = new Date();

    const qrCodeRecord = await prisma.qRCode.findUnique({
      where: { code: qrCode },
    });
    console.log("QR Code Record:", qrCodeRecord);

    if (qrCodeRecord?.creatorRole === "SATPAM") {
      const izinSatpam = await prisma.izinSatpam.findFirst({
        where: {
          pesertaMagangId: userId,
          diizinkan: true,
        },
      });
      console.log("Izin Satpam Record:", izinSatpam);
      console.log("izinSatpam", izinSatpam);
      if (!izinSatpam) {
        throw new Error(
          "QR code ini hanya dapat digunakan oleh peserta yang sudah mendapatkan izin dari pembimbing untuk scan di satpam"
        );
      }
    }
    // const today = new Date(
    //   now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    // );
    now.setHours(now.getHours() + 7); // Tambahkan 7 jam untuk WIB
    // console.log("Current date in WIB:", today);
    const todayWithTime = now;
    console.log("Current date in WIB:", todayWithTime);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pesertaMagang: true },
    });

    if (!user || !user.pesertaMagang) {
      throw new Error("Hanya peserta magang yang dapat melakukan kehadiran");
    }

    console.log("Current time (used):", todayWithTime);
    console.log("time + 7", todayWithTime.getHours() + 7);
    const validQR = await prisma.qRCode.findFirst({
      where: {
        code: qrCode,
        expiresAt: {
          gt: todayWithTime, // Pastikan QR code belum kadaluarsa
        },
        // OR: [
        //   {
        //     forRole: null,
        //   },
        //   {
        //     forRole: "PESERTA_MAGANG",
        //   },
        // ],
      },
    });
    console.log("Valid QR Code:", validQR);

    if (!validQR) {
      throw new Error("QR code tidak valid atau sudah kadaluarsa");
    }
    // Menjadi:
    const today = getWIBStartOfDay();
    const existingAttendance = await prisma.kehadiran.findFirst({
      where: {
        pesertaMagangId: user.pesertaMagang.id,
        createdAt: { gte: today },
      },
    });

    console.log("Existing Attendance:", existingAttendance);

    if (type === "MASUK") {
      if (existingAttendance?.waktuMasuk) {
        throw new Error("Anda sudah melakukan absen masuk hari ini");
      }

      if (existingAttendance) {
        return prisma.kehadiran.update({
          where: { id: existingAttendance.id },
          data: {
            status: "HADIR",
            waktuMasuk: todayWithTime,
            qrCodeMasuk: qrCode,
          },
        });
      } else {
        // if (existingAttendance) {
        return prisma.kehadiran.create({
          data: {
            pesertaMagangId: user.pesertaMagang.id,
            status: "HADIR",
            waktuMasuk: todayWithTime,
            qrCodeMasuk: qrCode,
          },
        });
        // }
      }
    }

    if (type === "PULANG") {
      if (existingAttendance?.waktuPulang) {
        throw new Error("Anda Sudah melakukan absen pulang hari ini");
      }
      if (!existingAttendance) {
        throw new Error("Anda belum melakukan absen masuk hari ini");
      }
      if (!existingAttendance.waktuMasuk) {
        throw new Error("Anda belum melakukan absen pulang hari ini");
      }

      return prisma.kehadiran.update({
        where: { id: existingAttendance.id },
        data: {
          waktuPulang: todayWithTime,
          qrCodePulang: qrCode,
          updatedAt: todayWithTime,
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
      // const hasPermission = await prisma.izinSatpam.findFirst({
      //   where: {
      //     satpamId: scanner.satpam.id,
      //     pesertaMagangId: pesertaMagang.id,
      //     diizinkan: true,
      //   },
      // });

      // if (!hasPermission) {
      //   throw new Error(
      //     "Satpam tidak memiliki izin untuk memindai peserta magang ini"
      //   );
      // }

      // VALIDASI: Cek apakah boleh scan
      const bolehScan = await this.validateSatpamAccess(pesertaMagang.id);
      console.log("bolehScan", bolehScan);

      const diizinkan = await prisma.izinSatpam.findFirst({
        where: {
          pesertaMagangId: pesertaMagang.id,
          diizinkan: true,
        },
      });
      console.log("diizinkan", diizinkan);

      const pembimbingPesertaMagang = pesertaMagang.pembimbingId
        ? await prisma.pembimbing.findUnique({
            where: { id: pesertaMagang.pembimbingId },
            include: { user: true },
          })
        : null;

      if (!bolehScan) {
        throw new Error(
          `Tidak diizinkan menscan peserta ini. ` +
            `Peserta sudah memiliki pembimbing (${pembimbingPesertaMagang?.user.nama}). ` +
            `Silakan minta pembimbing mengaktifkan izin satpam.`
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

    // const now = new Date();
    const today = getWIBStartOfDay();
    const todaywithoutTime = new Date();
    const now = new Date();
    now.setHours(now.getHours() + 7); // Tambahkan 7 jam untuk WIB
    const todayWithTime = now;
    console.log("now", now);
    console.log("Current date in WIB:", today);
    console.log("Current time (used):", todayWithTime);
    console.log("time + 7", todayWithTime.getHours() + 7);

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
        });
      } else {
        return prisma.kehadiran.create({
          data: {
            pesertaMagangId: pesertaMagang.id,
            status: "HADIR",
            waktuMasuk: todayWithTime,
            validatedBy: scannerId,
          },
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
        });
      }
    } else if (type === "PULANG") {
      console.log("Current date in WIB:", today);
      console.log("Current time (used):", todayWithTime);
      console.log("time + 7", todayWithTime.getHours() + 7);

      console.log("default time", todaywithoutTime);
      if (!existingAttendance?.waktuMasuk) {
        throw new Error("Peserta magang belum melakukan absen masuk hari ini");
      }
      if (existingAttendance?.waktuPulang) {
        throw new Error("Peserta magang sudah melakukan absen pulang hari ini");
      }

      return prisma.kehadiran.update({
        where: { id: existingAttendance.id },
        data: {
          waktuPulang: todayWithTime,
          validatedBy: scannerId,
        },
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
    console.log("Fetching attendance history for user:", userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pesertaMagang: true, pembimbing: true },
    });

    // console.log("User found:", user);
    if (!user) throw new Error("User tidak ditemukan");

    let whereClause: any = {};
    let pesertaMagangId: string | string[] | undefined;
    ``;
    const allkehadiran = await prisma.kehadiran.findMany({
      where: { pesertaMagangId: user.pesertaMagang?.id },
    });
    console.log("All kehadiran records:", allkehadiran);

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
      // whereClause.createdAt = { gte: new Date(startDate) };
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Set ke awal hari
      whereClause.createdAt = { gte: start };
      console.log("Start date filter:", start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set ke akhir hari
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: end,
      };
      console.log("Final whereClause:", whereClause);
    }

    console.log(whereClause);

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
    console.log("Attendance history fetched:", history, "records found");
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

    // Parse tanggal dan set ke awal hari
    const date = new Date(tanggal);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Cek apakah sudah ada kehadiran di tanggal tersebut
    const existingAttendance = await prisma.kehadiran.findFirst({
      where: {
        pesertaMagangId: user.pesertaMagang.id,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingAttendance) {
      throw new Error(
        "Anda sudah memiliki record kehadiran pada tanggal tersebut"
      );
    }

    const kehadiran = await prisma.kehadiran.create({
      data: {
        pesertaMagangId: user.pesertaMagang.id,
        status: jenis,
        alasan: alasan,
        validasiStatus: "PENDING",
        createdAt: startOfDay,
      },
      include: {
        pesertaMagang: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
                email: true,
              },
            },
            pembimbing: {
              include: {
                user: {
                  select: {
                    id: true,
                    nama: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      message: "Pengajuan izin berhasil dibuat",
      data: kehadiran,
    };
  }

  // Validasi izin oleh pembimbing/admin
  async validateIzin(
    validatorId: string,
    izinId: string,
    status: "APPROVED" | "REJECTED",
    catatan?: string
  ) {
    console.log(
      `Validating izin ${izinId} by validator ${validatorId} with status ${status} and note: ${catatan}`
    );
    const validator = await prisma.user.findUnique({
      where: { id: validatorId },
      include: { pembimbing: true },
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
            user: true,
            pembimbing: true,
          },
        },
      },
    });

    if (!izin) {
      throw new Error("Data izin tidak ditemukan");
    }

    if (izin.validasiStatus !== "PENDING") {
      throw new Error("Izin ini sudah divalidasi sebelumnya");
    }

    // Jika validator adalah pembimbing, pastikan dia membimbing peserta magang ini
    if (validator.role === "PEMBIMBING") {
      if (izin.pesertaMagang.pembimbingId !== validator.pembimbing?.id) {
        throw new Error(
          "Anda hanya dapat memvalidasi izin peserta magang yang Anda bimbing"
        );
      }
    }

    const updatedIzin = await prisma.kehadiran.update({
      where: { id: izinId },
      data: {
        validasiStatus: status,
        validasiAt: new Date(),
        validatedBy: validatorId,
        alasan: catatan
          ? `${izin.alasan}\n\nCatatan Validasi: ${catatan}`
          : izin.alasan,
      },
      include: {
        pesertaMagang: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      message: `Izin berhasil ${
        status === "APPROVED" ? "disetujui" : "ditolak"
      }`,
      data: updatedIzin,
    };
  }

  // Melihat riwayat izin untuk peserta magang
  async getMyIzinHistory(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pesertaMagang: true },
    });

    if (!user || !user.pesertaMagang) {
      throw new Error("Hanya peserta magang yang dapat melihat riwayat izin");
    }

    const izinHistory = await prisma.kehadiran.findMany({
      where: {
        pesertaMagangId: user.pesertaMagang.id,
        status: { in: ["IZIN", "SAKIT"] },
      },
      include: {
        pesertaMagang: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add validator info for validated items
    const izinWithValidator = await Promise.all(
      izinHistory.map(async (izin) => {
        let validatorInfo = null;
        if (izin.validatedBy) {
          validatorInfo = await prisma.user.findUnique({
            where: { id: izin.validatedBy },
            select: {
              id: true,
              nama: true,
              role: true,
            },
          });
        }

        return {
          ...izin,
          validator: validatorInfo,
        };
      })
    );

    return izinWithValidator;
  }

  // Melihat izin pending untuk pembimbing
  async getPendingIzinByPembimbing(pembimbingId: string) {
    const pembimbing = await prisma.user.findUnique({
      where: { id: pembimbingId },
      include: { pembimbing: true },
    });

    if (!pembimbing || pembimbing.role !== "PEMBIMBING") {
      throw new Error("Hanya pembimbing yang dapat melihat izin pending");
    }

    const pendingIzin = await prisma.kehadiran.findMany({
      where: {
        pesertaMagang: {
          pembimbingId: pembimbing.pembimbing?.id,
        },
        status: { in: ["IZIN", "SAKIT"] },
        validasiStatus: "PENDING",
      },
      include: {
        pesertaMagang: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
                email: true,
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

    return pendingIzin;
  }

  // Melihat semua riwayat izin untuk pembimbing
  async getAllIzinHistoryByPembimbing(pembimbingId: string) {
    const pembimbing = await prisma.user.findUnique({
      where: { id: pembimbingId },
      include: { pembimbing: true },
    });

    if (!pembimbing || pembimbing.role !== "PEMBIMBING") {
      throw new Error("Hanya pembimbing yang dapat melihat riwayat izin");
    }

    const izinHistory = await prisma.kehadiran.findMany({
      where: {
        pesertaMagang: {
          pembimbingId: pembimbing.pembimbing?.id,
        },
        status: { in: ["IZIN", "SAKIT"] },
      },
      include: {
        pesertaMagang: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
                email: true,
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

    // Add validator info
    const izinWithValidator = await Promise.all(
      izinHistory.map(async (izin) => {
        let validatorInfo = null;
        if (izin.validatedBy) {
          validatorInfo = await prisma.user.findUnique({
            where: { id: izin.validatedBy },
            select: {
              id: true,
              nama: true,
              role: true,
            },
          });
        }

        return {
          ...izin,
          validator: validatorInfo,
        };
      })
    );

    return izinWithValidator;
  }

  // Untuk admin - melihat semua izin (opsional)
  async getAllIzinForAdmin() {
    const allIzin = await prisma.kehadiran.findMany({
      where: {
        status: { in: ["IZIN", "SAKIT"] },
      },
      include: {
        pesertaMagang: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
                email: true,
                fotoProfil: true,
              },
            },
            pembimbing: {
              include: {
                user: {
                  select: {
                    id: true,
                    nama: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add validator info
    const izinWithValidator = await Promise.all(
      allIzin.map(async (izin) => {
        let validatorInfo = null;
        if (izin.validatedBy) {
          validatorInfo = await prisma.user.findUnique({
            where: { id: izin.validatedBy },
            select: {
              id: true,
              nama: true,
              role: true,
            },
          });
        }

        return {
          ...izin,
          validator: validatorInfo,
        };
      })
    );

    return izinWithValidator;
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
        "Waktu Masuk": k.waktuMasuk
          ? k.waktuMasuk.toLocaleTimeString("id-ID", {
              timeZone: "Asia/Jakarta",
            })
          : "-",
        "Waktu Pulang": k.waktuPulang
          ? k.waktuPulang.toLocaleTimeString("id-ID", {
              timeZone: "Asia/Jakarta",
            })
          : "-",
      })
    );

    return generateExcel(data, `Laporan Kehadiran ${pesertaMagang.user.nama}`);
  }

  // Export attendance untuk semua peserta berdasarkan asal instansi
  async exportAllAttendanceByInstansi(asalInstansi?: string) {
    const whereClause: any = {};

    // Filter berdasarkan asal instansi jika ada
    if (asalInstansi) {
      whereClause.pesertaMagang = {
        user: {
          asalInstansi: asalInstansi,
        },
      };
    }

    const kehadiran = await prisma.kehadiran.findMany({
      where: whereClause,
      include: {
        pesertaMagang: {
          include: {
            user: {
              select: {
                nama: true,
                asalInstansi: true,
                email: true,
                nomorTelepon: true,
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
        },
      },
      orderBy: [
        {
          pesertaMagang: {
            user: {
              asalInstansi: "asc",
            },
          },
        },
        {
          pesertaMagang: {
            user: {
              nama: "asc",
            },
          },
        },
        {
          createdAt: "asc",
        },
      ],
    });

    // Format data untuk Excel dengan styling yang lebih baik
    const data = kehadiran.map((k) => ({
      "📅 TANGGAL": new Date(k.createdAt).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      "👤 NAMA PESERTA": k.pesertaMagang.user.nama,
      "🏢 ASAL INSTANSI":
        k.pesertaMagang.user.asalInstansi || "Tidak Diketahui",
      "📧 EMAIL": k.pesertaMagang.user.email,
      "📱 NO. TELEPON": k.pesertaMagang.user.nomorTelepon || "-",
      "👨‍🏫 PEMBIMBING":
        k.pesertaMagang.pembimbing?.user.nama || "Belum Ditentukan",
      "📊 STATUS KEHADIRAN":
        k.status === "HADIR"
          ? "✅ HADIR"
          : k.status === "IZIN"
          ? "📝 IZIN"
          : k.status === "SAKIT"
          ? "🏥 SAKIT"
          : "❌ ALPHA",
      "🕐 WAKTU MASUK": k.waktuMasuk
        ? k.waktuMasuk.toLocaleTimeString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB"
        : "-",
      "🕕 WAKTU PULANG": k.waktuPulang
        ? k.waktuPulang.toLocaleTimeString("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB"
        : "-",
      "📝 KETERANGAN": k.alasan || "-",
      "✅ STATUS VALIDASI":
        k.validasiStatus === "APPROVED"
          ? "✅ Disetujui"
          : k.validasiStatus === "REJECTED"
          ? "❌ Ditolak"
          : k.validasiStatus === "PENDING"
          ? "⏳ Menunggu"
          : "-",
    }));

    const fileName = asalInstansi
      ? `📊 LAPORAN KEHADIRAN - ${asalInstansi.toUpperCase()}`
      : `📊 LAPORAN KEHADIRAN - SEMUA INSTANSI`;

    return generateExcel(data, fileName);
  }

  // Export summary attendance berdasarkan instansi
  async exportSummaryByInstansi() {
    const kehadiran = await prisma.kehadiran.findMany({
      include: {
        pesertaMagang: {
          include: {
            user: {
              select: {
                nama: true,
                asalInstansi: true,
                email: true,
                nomorTelepon: true,
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
        },
      },
    });

    // Group data berdasarkan instansi dan peserta
    const groupedData = kehadiran.reduce((acc: any, k) => {
      const instansi = k.pesertaMagang.user.asalInstansi || "Tidak Diketahui";
      const nama = k.pesertaMagang.user.nama;
      const email = k.pesertaMagang.user.email;
      const telepon = k.pesertaMagang.user.nomorTelepon;
      const pembimbing = k.pesertaMagang.pembimbing?.user.nama;
      const key = `${instansi}_${nama}`;

      if (!acc[key]) {
        acc[key] = {
          instansi,
          nama,
          email,
          telepon,
          pembimbing,
          totalHadir: 0,
          totalIzin: 0,
          totalSakit: 0,
          totalAlpha: 0,
          totalHari: 0,
          tanggalPertama: k.createdAt,
          tanggalTerakhir: k.createdAt,
        };
      }

      acc[key].totalHari++;

      // Update tanggal
      if (k.createdAt < acc[key].tanggalPertama) {
        acc[key].tanggalPertama = k.createdAt;
      }
      if (k.createdAt > acc[key].tanggalTerakhir) {
        acc[key].tanggalTerakhir = k.createdAt;
      }

      switch (k.status) {
        case "HADIR":
          acc[key].totalHadir++;
          break;
        case "IZIN":
          acc[key].totalIzin++;
          break;
        case "SAKIT":
          acc[key].totalSakit++;
          break;
        case "ALPHA":
          acc[key].totalAlpha++;
          break;
      }

      return acc;
    }, {});

    // Convert to array dan hitung persentase dengan styling yang lebih baik
    const summaryData = Object.values(groupedData).map((item: any) => {
      const persentaseKehadiran =
        item.totalHari > 0 ? (item.totalHadir / item.totalHari) * 100 : 0;

      let statusKehadiran = "";
      if (persentaseKehadiran >= 90) statusKehadiran = "🟢 EXCELLENT";
      else if (persentaseKehadiran >= 80) statusKehadiran = "🔵 GOOD";
      else if (persentaseKehadiran >= 70) statusKehadiran = "🟡 FAIR";
      else statusKehadiran = "🔴 NEEDS IMPROVEMENT";

      return {
        "🏢 ASAL INSTANSI": item.instansi,
        "👤 NAMA PESERTA": item.nama,
        "📧 EMAIL": item.email,
        "📱 NO. TELEPON": item.telepon || "-",
        "👨‍🏫 PEMBIMBING": item.pembimbing || "Belum Ditentukan",
        "📅 PERIODE": `${item.tanggalPertama.toLocaleDateString(
          "id-ID"
        )} - ${item.tanggalTerakhir.toLocaleDateString("id-ID")}`,
        "📊 TOTAL HARI": item.totalHari,
        "✅ HADIR": item.totalHadir,
        "📝 IZIN": item.totalIzin,
        "🏥 SAKIT": item.totalSakit,
        "❌ ALPHA": item.totalAlpha,
        "📈 PERSENTASE KEHADIRAN": `${persentaseKehadiran.toFixed(1)}%`,
        "🎯 STATUS": statusKehadiran,
      };
    });

    // Sort berdasarkan instansi dan persentase kehadiran
    summaryData.sort((a, b) => {
      if (a["🏢 ASAL INSTANSI"] !== b["🏢 ASAL INSTANSI"]) {
        return a["🏢 ASAL INSTANSI"].localeCompare(b["🏢 ASAL INSTANSI"]);
      }
      // Sort by persentase kehadiran (descending)
      const percentA = parseFloat(
        a["📈 PERSENTASE KEHADIRAN"].replace("%", "")
      );
      const percentB = parseFloat(
        b["📈 PERSENTASE KEHADIRAN"].replace("%", "")
      );
      return percentB - percentA;
    });

    const fileName = `📈 RINGKASAN KEHADIRAN PER INSTANSI`;
    return generateExcel(summaryData, fileName);
  } // Get daftar instansi untuk filter
  async getDaftarInstansi() {
    const instansi = await prisma.user.findMany({
      where: {
        role: "PESERTA_MAGANG",
        asalInstansi: {
          not: null,
        },
      },
      select: {
        asalInstansi: true,
      },
      distinct: ["asalInstansi"],
      orderBy: {
        asalInstansi: "asc",
      },
    });

    return instansi
      .map((item) => item.asalInstansi)
      .filter((instansi) => instansi !== null);
  }

  // Export rekap kehadiran semua peserta dalam format kolom per hari dengan tampilan yang bagus dan rapi
  async exportRekapKehadiranAll(asalInstansi?: string) {
    // Ambil semua data kehadiran
    const whereClause: any = {};

    if (asalInstansi) {
      whereClause.pesertaMagang = {
        user: {
          asalInstansi: asalInstansi,
        },
      };
    }

    const kehadiran = await prisma.kehadiran.findMany({
      where: whereClause,
      include: {
        pesertaMagang: {
          include: {
            user: {
              select: {
                nama: true,
                asalInstansi: true,
                email: true,
                nomorTelepon: true,
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
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Ambil semua peserta magang
    const pesertaMagangWhereClause: any = {};
    if (asalInstansi) {
      pesertaMagangWhereClause.user = {
        asalInstansi: asalInstansi,
      };
    }

    const allPesertaMagang = await prisma.pesertaMagang.findMany({
      where: pesertaMagangWhereClause,
      include: {
        user: {
          select: {
            nama: true,
            asalInstansi: true,
            email: true,
            nomorTelepon: true,
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
      orderBy: [
        {
          user: {
            asalInstansi: "asc",
          },
        },
        {
          user: {
            nama: "asc",
          },
        },
      ],
    });

    // Dapatkan semua tanggal unik dari data kehadiran dan urutkan
    const allDates = [
      ...new Set(kehadiran.map((k) => k.createdAt.toISOString().split("T")[0])),
    ].sort();

    // Group kehadiran berdasarkan peserta dan tanggal
    const kehadiranMap = kehadiran.reduce((acc: any, k) => {
      const pesertaId = k.pesertaMagangId;
      const tanggal = k.createdAt.toISOString().split("T")[0];
      const key = `${pesertaId}_${tanggal}`;

      acc[key] = {
        status: k.status,
        waktuMasuk: k.waktuMasuk
          ? k.waktuMasuk.toLocaleTimeString("id-ID", {
              timeZone: "Asia/Jakarta",
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
        waktuPulang: k.waktuPulang
          ? k.waktuPulang.toLocaleTimeString("id-ID", {
              timeZone: "Asia/Jakarta",
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
        alasan: k.alasan,
        validasiStatus: k.validasiStatus,
      };

      return acc;
    }, {});

    // Format data untuk Excel dengan header yang menarik
    const data = allPesertaMagang.map((peserta) => {
      const baseInfo: any = {
        "👤 NAMA PESERTA": peserta.user.nama,
        "🏢 ASAL INSTANSI": peserta.user.asalInstansi || "Tidak Diketahui",
        "📧 EMAIL": peserta.user.email,
        "📱 NO. TELEPON": peserta.user.nomorTelepon || "-",
        "👨‍🏫 PEMBIMBING": peserta.pembimbing?.user.nama || "Belum Ditentukan",
      };

      // Tambahkan kolom untuk setiap tanggal dengan format yang bagus
      allDates.forEach((tanggal) => {
        const key = `${peserta.id}_${tanggal}`;
        const kehadiranData = kehadiranMap[key];

        // Format header tanggal yang rapi
        const formatTanggal = new Date(tanggal).toLocaleDateString("id-ID", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "2-digit",
        });

        if (kehadiranData) {
          let cellValue = "";

          if (kehadiranData.status === "HADIR") {
            const masuk = kehadiranData.waktuMasuk || "??:??";
            const pulang = kehadiranData.waktuPulang || "??:??";
            cellValue = `✅ ${masuk}-${pulang}`;
          } else if (kehadiranData.status === "IZIN") {
            cellValue = `📝 IZIN`;
            if (kehadiranData.validasiStatus === "APPROVED") {
              cellValue += " ✅";
            } else if (kehadiranData.validasiStatus === "REJECTED") {
              cellValue += " ❌";
            } else {
              cellValue += " ⏳";
            }
          } else if (kehadiranData.status === "SAKIT") {
            cellValue = `🏥 SAKIT`;
            if (kehadiranData.validasiStatus === "APPROVED") {
              cellValue += " ✅";
            } else if (kehadiranData.validasiStatus === "REJECTED") {
              cellValue += " ❌";
            } else {
              cellValue += " ⏳";
            }
          } else if (kehadiranData.status === "ALPHA") {
            cellValue = `❌ ALPHA`;
          }

          baseInfo[`📅 ${formatTanggal}`] = cellValue;
        } else {
          baseInfo[`📅 ${formatTanggal}`] = "⚪ -";
        }
      });

      // Tambahkan statistik dengan format yang menarik
      const totalHari = allDates.length;
      const hadirCount = allDates.filter((tanggal) => {
        const key = `${peserta.id}_${tanggal}`;
        return kehadiranMap[key]?.status === "HADIR";
      }).length;
      const izinCount = allDates.filter((tanggal) => {
        const key = `${peserta.id}_${tanggal}`;
        return kehadiranMap[key]?.status === "IZIN";
      }).length;
      const sakitCount = allDates.filter((tanggal) => {
        const key = `${peserta.id}_${tanggal}`;
        return kehadiranMap[key]?.status === "SAKIT";
      }).length;
      const alphaCount = totalHari - hadirCount - izinCount - sakitCount;
      const persentase = totalHari > 0 ? (hadirCount / totalHari) * 100 : 0;

      baseInfo["📊 TOTAL HARI"] = totalHari;
      baseInfo["✅ HADIR"] = hadirCount;
      baseInfo["📝 IZIN"] = izinCount;
      baseInfo["🏥 SAKIT"] = sakitCount;
      baseInfo["❌ ALPHA"] = alphaCount;
      baseInfo["📈 PERSENTASE"] = `${persentase.toFixed(1)}%`;

      // Status berdasarkan persentase dengan emoji
      let statusKehadiran = "";
      if (persentase >= 90) statusKehadiran = "🟢 EXCELLENT";
      else if (persentase >= 80) statusKehadiran = "🔵 GOOD";
      else if (persentase >= 70) statusKehadiran = "🟡 FAIR";
      else statusKehadiran = "🔴 NEEDS IMPROVEMENT";

      baseInfo["🎯 STATUS"] = statusKehadiran;

      return baseInfo;
    });

    const fileName = asalInstansi
      ? `📋 REKAP KEHADIRAN HARIAN - ${asalInstansi.toUpperCase()}`
      : `📋 REKAP KEHADIRAN HARIAN - SEMUA PESERTA MAGANG`;

    return generateExcel(data, fileName);
  }

  // Ganti fungsi validasi
  private async validateSatpamAccess(
    pesertaMagangId: string
  ): Promise<boolean> {
    const pesertaMagang = await prisma.pesertaMagang.findUnique({
      where: { id: pesertaMagangId },
      include: {
        pembimbing: true,
        izinSatpam: true,
      },
    });

    if (!pesertaMagang) throw new Error("Peserta magang tidak ditemukan");

    // Case 1: Tidak punya pembimbing → BOLEH scan
    if (!pesertaMagang.pembimbing) return true;

    // Case 2: Punya pembimbing dan ada izin global → BOLEH scan
    if (pesertaMagang.izinSatpam?.[0]?.diizinkan) return true;

    // Case 3: Punya pembimbing tapi tidak diizinkan → DITOLAK
    return false;
  }

  async getAllMyHistoryAttendance(userId: string) {
    const history = await prisma.kehadiran.findMany({
      where: {
        pesertaMagang: {
          userId: userId,
        },
      },
    });

    console.log("History:", history);
    if (!history) {
      throw new Error("Belum ada riwayat kehadiran");
    }

    return history;
  }

  async myStudentAttendanceHistory(pembimbingId: string) {
    try {
      const history = await prisma.kehadiran.findMany({
        where: {
          pesertaMagang: {
            pembimbing: {
              userId: pembimbingId,
            },
          },
        },
      });
      return history;
    } catch (error) {
      console.error("Error fetching student attendance history:", error);
      throw new Error("Failed to fetch student attendance history");
    }
  }
  // Update fungsi requestIzin di kehadiran.service.ts
}

export default new kehadiranService();
