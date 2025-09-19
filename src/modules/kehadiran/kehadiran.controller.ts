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
      console.log(
        `Recording attendance for user ${userId} with QR code ${qrCode} and type ${type}`
      );
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

  //

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
  async requestIzin(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { alasan, tanggal, jenis } = req.body;

      if (!alasan || !tanggal || !jenis) {
        return res.status(400).json({
          error: "Alasan, tanggal, dan jenis izin harus diisi",
        });
      }

      if (!["IZIN", "SAKIT"].includes(jenis)) {
        return res.status(400).json({
          error: "Jenis izin harus IZIN atau SAKIT",
        });
      }

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

  // Validasi izin
  async validateIzin(req: AuthenticatedRequest, res: Response) {
    try {
      const validatorId = req.user?.id;
      const { izinId, status, catatan } = req.body;

      if (!izinId || !status) {
        return res.status(400).json({
          error: "ID izin dan status validasi harus diisi",
        });
      }

      if (!["APPROVED", "REJECTED"].includes(status)) {
        return res.status(400).json({
          error: "Status harus APPROVED atau REJECTED",
        });
      }

      const result = await kehadiranService.validateIzin(
        validatorId!,
        izinId,
        status,
        catatan
      );

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Riwayat izin untuk peserta magang
  async getMyIzinHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await kehadiranService.getMyIzinHistory(userId!);
      res.json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Izin pending untuk pembimbing
  async getPendingIzin(req: AuthenticatedRequest, res: Response) {
    try {
      const pembimbingId = req.user?.id;
      const result = await kehadiranService.getPendingIzinByPembimbing(
        pembimbingId!
      );
      res.json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Riwayat izin untuk pembimbing
  async getAllIzinHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const pembimbingId = req.user?.id;
      const result = await kehadiranService.getAllIzinHistoryByPembimbing(
        pembimbingId!
      );
      res.json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Semua izin untuk admin
  async getAllIzinForAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await kehadiranService.getAllIzinForAdmin();
      res.json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Export attendance semua peserta berdasarkan instansi (tanpa filter tanggal)
  async exportAllAttendanceByInstansi(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const { asalInstansi } = req.query;

      const result = await kehadiranService.exportAllAttendanceByInstansi(
        asalInstansi as string | undefined
      );

      // Generate nama file yang bagus dengan timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = asalInstansi
        ? `📊 LAPORAN KEHADIRAN - ${asalInstansi
            .toString()
            .toUpperCase()} - ${timestamp}.xlsx`
        : `📊 LAPORAN KEHADIRAN - SEMUA INSTANSI - ${timestamp}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.send(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Export summary attendance berdasarkan instansi (tanpa filter tanggal)
  async exportSummaryByInstansi(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await kehadiranService.exportSummaryByInstansi();

      console.log(result);
      // Generate nama file yang bagus dengan timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `📈 RINGKASAN KEHADIRAN PER INSTANSI - ${timestamp}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.send(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get daftar instansi untuk filter
  async getDaftarInstansi(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await kehadiranService.getDaftarInstansi();
      res.json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Export rekap kehadiran semua peserta dalam format kolom per hari
  async exportRekapKehadiranAll(req: AuthenticatedRequest, res: Response) {
    try {
      const { asalInstansi } = req.query;

      const result = await kehadiranService.exportRekapKehadiranAll(
        asalInstansi as string | undefined
      );

      // Generate nama file yang bagus dengan timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = asalInstansi
        ? `📋 REKAP KEHADIRAN HARIAN - ${asalInstansi
            .toString()
            .toUpperCase()} - ${timestamp}.xlsx`
        : `📋 REKAP KEHADIRAN HARIAN - SEMUA PESERTA MAGANG - ${timestamp}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.send(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllMyHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      console.log(userId);
      const result = await kehadiranService.getAllMyHistoryAttendance(userId!);
      console.log(result);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new KehadiranController();
