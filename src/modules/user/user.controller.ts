import { NextFunction, Request, Response } from "express";
import userService from "./user.service";
import { UpdateProfileInput } from "../../utils/types";

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}
class UserController {
  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await userService.getProfile(userId!);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const data: UpdateProfileInput = req.body;
      const result = await userService.updateProfile(userId!, data);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateProfilePicture(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const file = req.file;
      if (!file) throw new Error("File tidak ditemukan");
      const result = await userService.updateProfilePicture(userId!, file);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const { role } = req.query;
      const result = await userService.getAllusers(role as string | undefined);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const { nama, email, role, nomorTelepon } = req.body;
      const result = await userService.createUser({
        nama,
        email,
        role,
        nomorTelepon,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = await userService.updateUser(id, data);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new UserController();
