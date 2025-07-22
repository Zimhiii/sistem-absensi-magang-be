import { Request, Response } from "express";
import pembimbingService from "./pembimbing.service";

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

class PembimbingController {
  async getMyStudents(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await pembimbingService.getMyStudents(userId!);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async verifiyStudent(req: AuthenticatedRequest, res: Response) {
    try {
      const pembimbingId = req.user?.id;
      const { pesertaMagangId, status } = req.body;
      const result = await pembimbingService.verifyStudent(
        pembimbingId!,
        pesertaMagangId,
        status
      );
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async grantSatpamPermission(req: AuthenticatedRequest, res: Response) {
    try {
      const pembimbingId = req.user?.id;
      const { satpamId, pesertaMagangId, grant } = req.body;
      const result = await pembimbingService.grantSatpamPermission(
        pembimbingId!,
        satpamId,
        pesertaMagangId,
        grant
      );
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new PembimbingController();
