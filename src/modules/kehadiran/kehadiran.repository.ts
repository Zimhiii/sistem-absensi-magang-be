import prisma from "../../config/prisma";

class kehadiranRepository {
  async createkehadiran(data: any) {
    return prisma.kehadiran.create({
      data,
    });
  }

  async findKehadiranById(id: string) {
    return prisma.kehadiran.findUnique({
      where: { id },
    });
  }

  async findKehadiranByPesertaMagangId(pesertaMagangId: string, date: Date) {
    return prisma.kehadiran.findFirst({
      where: {
        pesertaMagangId,
        createdAt: {
          gte: date,
        },
      },
    });
  }

  async updateKehadiran(id: string, data: any) {
    return prisma.kehadiran.update({
      where: { id },
      data,
    });
  }

  async deleteKehadiran(id: string) {
    return prisma.kehadiran.delete({
      where: { id },
    });
  }

  async findKehadiranByDateRange(
    pesertaMagangId: string,
    startDate: Date,
    endDate: Date
  ) {
    return prisma.kehadiran.findMany({
      where: {
        pesertaMagangId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }
}

export default new kehadiranRepository();
