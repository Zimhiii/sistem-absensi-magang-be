import prisma from "../../config/prisma";

class UserRepository {
  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }
  async updateUser(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }
  async deteteUser(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}

export default new UserRepository();
