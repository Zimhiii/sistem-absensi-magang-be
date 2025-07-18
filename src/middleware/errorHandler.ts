import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err.stack);

  if (err.name === "ValidationError") {
    res.status(400).json({ error: err.message });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Tidak terautentikasi" });
  }

  res.status(500).json({ error: "Terjadi kesalahan pada server" });
}
