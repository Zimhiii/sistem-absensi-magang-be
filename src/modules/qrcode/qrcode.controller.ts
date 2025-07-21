import { Request, Response } from "express";
import qrcodeService from "./qrcode.service";

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

class QRCodeController {
  async generateQRCode(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { expiresInMinutes, forRole, pesertaMagangId } = req.body;
      const result = await qrcodeService.generateQRCode(
        userId!,
        expiresInMinutes,
        forRole,
        pesertaMagangId
      );

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMyQRCode(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await qrcodeService.getMyQRCode(userId!);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getGeneratedQRCodes(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await qrcodeService.getGenerateQRCodes(userId!);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new QRCodeController();
