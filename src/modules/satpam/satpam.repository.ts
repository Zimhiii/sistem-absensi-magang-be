class SatpamRepository {
  async findSatpamByUserId(userId: string) {
    return prisma.satpam.findUnique({
      where: { userId },
    });
  }
}

export default new SatpamRepository();
