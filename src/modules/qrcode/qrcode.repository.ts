import prisma from "../../config/prisma";

class QRCodeRepository {
  async createQRCode(data: any) {
    return prisma.qRCode.create({ data });
  }

  async findQRCodeByCode(code: string) {
    return prisma.qRCode.findUnique({
      where: { code },
    });
  }

  async findQRCodesByCreator(creatorId: string) {
    return prisma.qRCode.findMany({
      where: { creatorId },
    });
  }
}

export default new QRCodeRepository();
