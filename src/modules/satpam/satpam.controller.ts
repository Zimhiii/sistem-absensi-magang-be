import { Request, Response } from "express";
import satpamService from "./satpam.service";

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

class SatpamController {
  // async getPermissions(req: AuthenticatedRequest, res: Response) {
  //   try {
  //     const userId = req.user?.id;
  //     const result = await satpamService.getPermissions(userId!);
  //     res.status(200).json(result);
  //   } catch (error: any) {
  //     res.status(400).json({ error: error.message });
  //   }
  // }

  // Ganti method
  async getAccessibleStudents(req: Request, res: Response) {
    try {
      const result = await satpamService.getAccessibleStudents();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new SatpamController();
