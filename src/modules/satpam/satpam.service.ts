class SatpamService {
  async getPermissions(satpamId: string) {
    const satpam = await prisma.satpam.findUnique({
      where: { userId: satpamId },
      include: {
        izinSatpam: {
          include: {
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
        },
      },
    });

    if (!satpam) throw new Error("Satpam tidak ditemukan");

    return satpam.izinSatpam;
  }
}

export default new SatpamService();
