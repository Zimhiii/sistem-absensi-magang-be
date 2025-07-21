"use strict";
// import { PrismaClient } from "../../generated/prisma";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// import { PrismaClient } from "@prisma/client";
let prisma = new client_1.PrismaClient({ log: ["query", "info", "warn", "error"] });
if (!globalThis.prisma) {
    globalThis.prisma = new client_1.PrismaClient();
}
prisma = globalThis.prisma;
exports.default = prisma;
