import prisma from "../../config/prisma";
import supabase from "../../config/supabase";

class AuthService {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error("Email atau password salah");

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        pesertaMagang: true,
        pembimbing: true,
        satpam: true,
      },
    });

    if (!user) throw new Error("User tidak ditemukan");
  }
}
