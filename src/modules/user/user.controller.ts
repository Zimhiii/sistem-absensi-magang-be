import { NextFunction, Request, Response } from "express";
import userService from "./user.service";
import { UpdateProfileInput } from "../../utils/types";

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}
class UserController {
  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      let id = req.params.id;
      if (!id) {
        id = req.user?.id!;
      }
      const result = await userService.getProfile(id!);
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

  // user.controller.ts - Tambahkan method ini
  async getDaftarInstansiForPeserta(req: AuthenticatedRequest, res: Response) {
    try {
      const instansiList = await userService.getDaftarInstansiForPeserta();
      console.log("Daftar Instansi:", instansiList);
      res.json({
        message: "Daftar instansi berhasil diambil",
        data: instansiList,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTodayAttendance(req: AuthenticatedRequest, res: Response) {
    try {
      const response = await userService.getTodatyAttendance();
      console.log("Get Today Attendance Response:", response);
      res.status(200).json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateProfilePicture(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      console.log("User ID:", userId);
      const file = req.file;
      console.log("File:", file);
      if (!file) throw new Error("File tidak ditemukan");
      const result = await userService.updateProfilePicture(userId!, file);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const result = await userService.getUserById(userId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    console.log("Get All Users Request:", req.query);
    try {
      const { role } = req.query;
      console.log("Get All Users Role:", role);
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
      console.log("Create User Result:", result);
      res.status(201).json(result);
      // return result;
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
      console.log("Delete User Result:", result);
      if (!result) throw new Error("User tidak ditemukan");
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new UserController();
