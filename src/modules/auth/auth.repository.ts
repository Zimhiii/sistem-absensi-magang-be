import prisma from "../../config/prisma";

class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }
  async createUser(data: any) {
    return prisma.user.create({
      data,
    });
  }
}

export default new AuthRepository();
