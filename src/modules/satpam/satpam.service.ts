class SatpamService {
  // async getPermissions(satpamId: string) {
  //   const satpam = await prisma.satpam.findUnique({
  //     where: { userId: satpamId },
  //     include: {
  //       izinSatpam: {
  //         include: {
  //           pembimbing: {
  //             include: {
  //               user: {
  //                 select: {
  //                   id: true,
  //                   nama: true,
  //                 },
  //               },
  //             },
  //           },
  //           pesertaMagang: {
  //             include: {
  //               user: {
  //                 select: {
  //                   id: true,
  //                   nama: true,
  //                   fotoProfil: true,
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   if (!satpam) throw new Error("Satpam tidak ditemukan");

  //   return satpam.izinSatpam;
  // }

  // Ganti method getPermissions
  async getAccessibleStudents() {
    const semuaPeserta = await prisma.pesertaMagang.findMany({
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            fotoProfil: true,
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
        izinSatpam: true,
      },
    });

    return semuaPeserta.map((peserta) => {
      const bisaDiscan =
        !peserta.pembimbing || peserta.izinSatpam?.[0]?.diizinkan;

      return {
        id: peserta.id,
        nama: peserta.user.nama,
        fotoProfil: peserta.user.fotoProfil,
        pembimbing: peserta.pembimbing?.user.nama || null,
        bisaDiscan,
        alasan: bisaDiscan
          ? peserta.pembimbing
            ? "Diizinkan oleh pembimbing"
            : "Tidak punya pembimbing"
          : `Belum diizinkan oleh ${peserta.pembimbing?.user.nama}`,
      };
    });
  }
}

export default new SatpamService();
