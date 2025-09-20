class PembimbingService {
  async getAllPembimbing() {
    return await prisma.pembimbing.findMany({
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
    });
  }

  async selectPembimbing(userId: string, pembimbingId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pesertaMagang: true },
    });

    if (!user?.pesertaMagang) {
      throw new Error("Hanya peserta magang yang dapat memilih pembimbing");
    }

    return await prisma.pesertaMagang.update({
      where: { id: user.pesertaMagang.id },
      data: { pembimbingId, validasiStatusPembimbing: "PENDING" },
    });
  }
  async getMyStudents(pembimbingId: string) {
    const pembimbing = await prisma.pembimbing.findUnique({
      where: { userId: pembimbingId },
      include: {
        pesertaMagang: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
                email: true,
                fotoProfil: true,
                nomorTelepon: true,
                asalInstansi: true,
              },
            },
            kehadiran: {
              orderBy: {
                createdAt: "desc",
              },
              take: 7,
            },
          },
        },
      },
    });
    if (!pembimbing) throw new Error("Pembimbing tidak ditemukan");
    return pembimbing.pesertaMagang;
  }

  async verifyStudent(
    pembimbingId: string,
    pesertaMagangId: string,
    status: "ACCEPT" | "REJECT"
  ) {
    const pembimbing = await prisma.pembimbing.findUnique({
      where: { userId: pembimbingId },
    });

    if (!pembimbing) {
      throw new Error("Pembimbing tidak ditemukan");
    }

    const pesertaMagang = await prisma.pesertaMagang.findUnique({
      where: { id: pesertaMagangId },
    });

    if (!pesertaMagang) throw new Error("Peserta magang tidak ditemukan");

    if (
      pesertaMagang.pembimbingId &&
      pesertaMagang.pembimbingId !== pembimbing.id
    ) {
      throw new Error("Peserta magang ini sudah memiliki pembimbing lain");
    }

    if (status === "ACCEPT") {
      return prisma.pesertaMagang.update({
        where: { id: pesertaMagangId },
        data: {
          pembimbingId: pembimbing.id,
          validasiStatusPembimbing: "APPROVED",
        },
      });
    } else {
      return prisma.pesertaMagang.update({
        where: { id: pesertaMagangId },
        data: {
          pembimbingId: pembimbing.id,
          validasiStatusPembimbing: "REJECTED",
        },
      });
    }
  }

  // async grantSatpamPermission(
  //   pembimbingId: string,
  //   satpamId: string,
  //   pesertaMagangId: string,
  //   grant: boolean
  // ) {
  //   const pembimbing = await prisma.pembimbing.findUnique({
  //     where: { userId: pembimbingId },
  //   });

  //   if (!pembimbing) throw new Error("Pembimbing tidak ditemukan");

  //   const satpam = await prisma.satpam.findUnique({
  //     where: { id: satpamId },
  //   });

  //   if (!satpam) throw new Error("Satpam tidak ditemukan");

  //   const pesertaMagang = await prisma.pesertaMagang.findUnique({
  //     where: { id: pesertaMagangId },
  //   });

  //   if (!pesertaMagang) throw new Error("Peserta magang tidak ditemukan");

  //   if (pesertaMagang.pembimbingId !== pembimbing.id) {
  //     throw new Error("Peserta magang tidak berada di bawah naungan Anda");
  //   }

  //   const existingPermission = await prisma.izinSatpam.findFirst({
  //     where: {
  //       satpamId: satpam.id,
  //       pesertaMagangId: pesertaMagang.id,
  //     },
  //   });

  //   if (existingPermission) {
  //     return prisma.izinSatpam.update({
  //       where: { id: existingPermission.id },
  //       data: {
  //         diizinkan: grant,
  //       },
  //     });
  //   } else {
  //     return prisma.izinSatpam.create({
  //       data: {
  //         pembimbingId: pembimbing.id,
  //         satpamId: satpam.id,
  //         pesertaMagangId: pesertaMagang.id,
  //         diizinkan: grant,
  //       },
  //     });
  //   }
  // }

  // Tambahkan method baru

  // Tambahkan method baru

  // Tambahkan method baru
  async toggleGlobalPermission(
    pembimbingId: string,
    pesertaMagangId: string,
    grant: boolean
  ) {
    // Cek apakah pembimbing valid
    const pembimbing = await prisma.pembimbing.findUnique({
      where: { userId: pembimbingId },
    });
    if (!pembimbing) throw new Error("Pembimbing tidak ditemukan");

    // Cek apakah peserta magang berada di bawah naungan pembimbing
    const pesertaMagang = await prisma.pesertaMagang.findUnique({
      where: {
        id: pesertaMagangId,
        pembimbingId: pembimbing.id,
      },
    });
    if (!pesertaMagang)
      throw new Error(
        "Peserta magang tidak ditemukan atau bukan di bawah naungan Anda"
      );

    // Cek apakah sudah ada record
    const existingPermission = await prisma.izinSatpam.findUnique({
      where: {
        pembimbingId_pesertaMagangId: {
          pembimbingId: pembimbing.id,
          pesertaMagangId: pesertaMagang.id,
        },
      },
    });

    if (existingPermission) {
      // Update existing record
      return prisma.izinSatpam.update({
        where: { id: existingPermission.id },
        data: { diizinkan: grant },
      });
    } else {
      // Create new record
      return prisma.izinSatpam.create({
        data: {
          pembimbingId: pembimbing.id,
          pesertaMagangId: pesertaMagang.id,
          diizinkan: grant,
        },
      });
    }
  }

  async getGlobalPermissions(pembimbingId: string) {
    const pembimbing = await prisma.pembimbing.findUnique({
      where: { userId: pembimbingId },
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
            izinSatpam: true,
          },
        },
      },
    });

    if (!pembimbing) throw new Error("Pembimbing tidak ditemukan");

    return pembimbing.pesertaMagang.map((peserta) => ({
      id: peserta.id,
      nama: peserta.user.nama,
      email: peserta.user.email,
      izinAktif: peserta.izinSatpam?.[0]?.diizinkan || false,
    }));
  }
}

export default new PembimbingService();
