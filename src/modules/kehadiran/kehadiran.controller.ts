import { Request, Response } from "express";
import kehadiranService from "./kehadiran.service";

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

class KehadiranController {
  async recordAttendance(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { qrCode, type } = req.body;
      const result = await kehadiranService.recordAttendance(
        userId!,
        qrCode,
        type
      );
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async scanAttendance(req: AuthenticatedRequest, res: Response) {
    try {
      const scannerId = req.user?.id;
      const { qrCode, type } = req.body;
      const result = await kehadiranService.scanAttendace(
        scannerId!,
        qrCode,
        type
      );
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAttendanceHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;
      const result = await kehadiranService.getAttendanceHistory(
        userId!,
        startDate as string | undefined,
        endDate as string | undefined
      );
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async requestIzin(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { alasan, tanggal, jenis } = req.body; // jenis: 'IZIN' atau 'SAKIT'
      const result = await kehadiranService.requestIzin(
        userId!,
        alasan,
        tanggal,
        jenis
      );
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async validateIzin(req: AuthenticatedRequest, res: Response) {
    try {
      const validatorId = req.user?.id;
      const { izinId, status } = req.body; // status: 'APPROVED' atau 'REJECTED'
      const result = await kehadiranService.validateIzin(
        validatorId!,
        izinId,
        status
      );
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async exportAttendance(req: AuthenticatedRequest, res: Response) {
    try {
      const { pesertaMagangId, startDate, endDate } = req.query;
      const result = await kehadiranService.exportAttendance(
        pesertaMagangId as string,
        startDate as string,
        endDate as string
      );

      // Set headers untuk file Excel
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=laporan-kehadiran-${pesertaMagangId}.xlsx`
      );

      res.status(200).send(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new KehadiranController();
