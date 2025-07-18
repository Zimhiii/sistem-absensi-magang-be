import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
const JWT_SECRET = process.env.JWT_SECRET || "secret";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: "ADMIN" | "PEMBIMBING" | "SATPAM" | "PESERTA_MAGANG";
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error("Token not found");
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    if (!user) {
      throw new Error("User tidak ditemukan");
    }

    req.user = {
      id: user.id,
      role: user.role as "ADMIN" | "PEMBIMBING" | "SATPAM" | "PESERTA_MAGANG",
    };

    next();
  } catch (error: any) {
    res.status(401).json({ error: "Silahkan login terlebih dahulu" });
  }
}

export function authorize(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user?.role!)) {
      return res.status(403).json({ error: "Anda tidak memiliki akses" });
    }
    next();
  };
}
