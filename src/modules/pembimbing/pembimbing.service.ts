class PembimbingService {
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
        },
      });
    } else {
      return { message: "Verifikasi peserta magang ditolak" };
    }
  }

  async grantSatpamPermission(
    pembimbingId: string,
    satpamId: string,
    pesertaMagangId: string,
    grant: boolean
  ) {
    const pembimbing = await prisma.pembimbing.findUnique({
      where: { userId: pembimbingId },
    });

    if (!pembimbing) throw new Error("Pembimbing tidak ditemukan");

    const satpam = await prisma.satpam.findUnique({
      where: { id: satpamId },
    });

    if (!satpam) throw new Error("Satpam tidak ditemukan");

    const pesertaMagang = await prisma.pesertaMagang.findUnique({
      where: { id: pesertaMagangId },
    });

    if (!pesertaMagang) throw new Error("Peserta magang tidak ditemukan");

    if (pesertaMagang.pembimbingId !== pembimbing.id) {
      throw new Error("Peserta magang tidak berada di bawah naungan Anda");
    }

    const existingPermission = await prisma.izinSatpam.findFirst({
      where: {
        satpamId: satpam.id,
        pesertaMagangId: pesertaMagang.id,
      },
    });

    if (existingPermission) {
      return prisma.izinSatpam.update({
        where: { id: existingPermission.id },
        data: {
          diizinkan: grant,
        },
      });
    } else {
      return prisma.izinSatpam.create({
        data: {
          pembimbingId: pembimbing.id,
          satpamId: satpam.id,
          pesertaMagangId: pesertaMagang.id,
          diizinkan: grant,
        },
      });
    }
  }
}

export default new PembimbingService();
