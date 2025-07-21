import { PrismaClient } from "../../generated/prisma";

let prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] });

if (!globalThis.prisma) {
  globalThis.prisma = new PrismaClient();
}
prisma = globalThis.prisma;

declare global {
  var prisma: PrismaClient;
}

export default prisma;
