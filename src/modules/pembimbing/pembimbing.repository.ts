class PembimbingRepository {
  async findPembimbingByUserId(userId: string) {
    return prisma.pembimbing.findUnique({
      where: { userId },
    });
  }

  async updatePembimibng(id: string, data: any) {
    return prisma.pembimbing.update({
      where: { id },
      data,
    });
  }
}

export default new PembimbingRepository();
