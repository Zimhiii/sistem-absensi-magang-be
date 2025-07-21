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
}
