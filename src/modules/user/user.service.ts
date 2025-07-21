// import { Role } from "../../../generated/prisma";
import prisma from "../../config/prisma.js";
import { Prisma } from "@prisma/client";
import supabase from "../../config/supabase.js";
import { UpdateProfileInput } from "../../utils/types.js";

class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        pesertaMagang: true,
        pembimbing: true,
        satpam: true,
      },
    });

    if (!user) throw new Error("User tidak ditemukan");

    return {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      fotoProfil: user.fotoProfil,
      nomorTelepon: user.nomorTelepon,
      asalInstansi: user.asalInstansi,
      pesertaMagang: user.pesertaMagang,
      pembimbing: user.pembimbing,
      satpam: user.satpam,
    };
  }
  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        nama: data.nama,
        nomorTelepon: data.nomorTelepon,
        asalInstansi: data.asalInstansi,
      },
    });

    return {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      fotoProfil: user.fotoProfil,
      nomorTelepon: user.nomorTelepon,
      asalInstansi: user.asalInstansi,
    };
  }

  async updateProfilePicture(userId: string, file: Express.Multer.File) {
    const fileExt = file.originalname.split(".").pop();
    const fileName = `profile-${userId}-${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) throw new Error("Gagal mengupload foto profil");

    const { data: urlData } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(fileName);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fotoProfil: urlData.publicUrl,
      },
    });

    return {
      fotoProfil: user.fotoProfil,
    };
  }

  async getAllusers(role?: string) {
    const where = role
      ? { role: role as "ADMIN" | "PEMBIMBING" | "SATPAM" | "PESERTA_MAGANG" }
      : {};
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        fotoProfil: true,
        nomorTelepon: true,
        asalInstansi: true,
        createdAt: true,
      },
    });
    return users;
  }

  async createUser(data: {
    nama: string;
    email: string;
    role: "ADMIN" | "PEMBIMBING" | "SATPAM" | "PESERTA_MAGANG";
    nomorTelepon?: string;
  }) {
    const { data: supabaseData, error } = await supabase.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
    });

    if (error) throw new Error(error.message);

    const user = await prisma.user.create({
      data: {
        nama: data.nama,
        email: data.email,
        role: data.role,
        nomorTelepon: data.nomorTelepon,
      },
    });

    if (data.role === "PESERTA_MAGANG") {
      await prisma.pesertaMagang.create({
        data: {
          userId: user.id,
          qrCode: `MAGANG-${user.id}-${Date.now()}`,
        },
      });
    }

    if (data.role === "SATPAM") {
      await prisma.satpam.create({
        data: {
          userId: user.id,
        },
      });
    }

    if (data.role === "PEMBIMBING") {
      await prisma.pembimbing.create({
        data: {
          userId: user.id,
        },
      });
    }

    return {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    };
  }

  async updateUser(id: string, data: any) {
    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        nama: data.nama,
        nomorTelepon: data.nomorTelepon,
      },
    });

    return {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    };
  }

  async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id: id } });
    if (!user) throw new Error("User tidak ditemukan");

    await supabase.auth.admin.deleteUser(user.email);

    await prisma.user.delete({ where: { id: id } });

    return { succes: true };
  }
}

export default new UserService();
