import prisma from "../../config/prisma";
import supabase from "../../config/supabase";
import { generateJWT } from "../../utils/helpers";
import { SignupInput, UpdateProfileInput } from "../../utils/types";

class AuthService {
  // async login(email: string, password: string) {
  //   try {
  //     const { data: supabaseUser, error } =
  //       await supabase.auth.signInWithPassword({
  //         email,
  //         password,
  //       });
  //     console.log("Login Data:", supabaseUser);
  //     if (error) throw new Error("Email atau password salah");
  //   } catch (error) {
  //     console.error("Login Error:", error);
  //   }

  //   const user = await prisma.user.findUnique({
  //     where: {
  //       email,
  //     },
  //     include: {
  //       pesertaMagang: true,
  //       pembimbing: true,
  //       satpam: true,
  //     },
  //   });

  //   if (!user) throw new Error("User tidak ditemukan");

  //   return {
  //     id: user.id,
  //     nama: user.nama,
  //     email: user.email,
  //     role: user.role,
  //     fotoProfil: user.fotoProfil,
  //     nomorTelepon: user.nomorTelepon,
  //     asalInstansi: user.asalInstansi,
  //     pesertaMagang: user.pesertaMagang,
  //     pembimbing: user.pembimbing,
  //     satpam: user.satpam,
  //   };
  // }

  async login(email: string, password: string) {
    // 1. Login ke Supabase terlebih dahulu
    const { data: supabaseUser, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    console.log("Login Data:", supabaseUser);

    console.log("error:", error);

    if (error?.message === "Email not confirmed") {
      throw new Error("Email belum diverifikasi. Silakan cek email Anda");
    }

    if (error) {
      console.error("Supabase Login Error:", error);
      throw new Error("Email atau password salah");
    }

    // 2. Jika berhasil, ambil data user dari Prisma
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        pesertaMagang: true,
        pembimbing: true,
        satpam: true,
      },
    });

    if (!user) throw new Error("User tidak ditemukan");

    // 3. Generate token JWT
    const token = generateJWT(user.id, user.role);

    // 4. Return response yang konsisten
    return {
      token,
      user: {
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
      },
    };
  }

  async singup(data: SignupInput) {
    try {
      const { data: supabaseUser, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      const user = await prisma.user.create({
        data: {
          id: supabaseUser.user?.id,
          nama: data.nama,
          email: data.email,
          asalInstansi: data.asalInstansi,
          nomorTelepon: data.nomorTelepon,
          role: "PESERTA_MAGANG",
        },
      });

      await prisma.pesertaMagang.create({
        data: {
          userId: user.id,
          qrCode: `MAGANG-${user.id}-${Date.now()}`,
        },
      });

      const token = generateJWT(user.id, user.role);

      return {
        token,
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role,
          asalInstansi: user.asalInstansi,
          nomorTelepon: user.nomorTelepon,
          fotoProfil: user.fotoProfil,
        },
      };
      console.log("Signup Data:", supabaseUser);
    } catch (error) {
      console.error("Signup Error:", error);
      // if (error) throw new Error(error);
    }
  }

  async loginWithGoogle(token: string) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token,
    });

    if (error) throw new Error(error.message);

    const user = await prisma.user.findUnique({
      where: { email: data.user?.email! },
      include: {
        pesertaMagang: true,
        pembimbing: true,
        satpam: true,
      },
    });

    if (!user) throw new Error("User tidak ditemukan");

    const jwtToken = generateJWT(user.id, user.role);

    return {
      token: jwtToken,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        fotoProfil: user.fotoProfil,
      },
    };
  }

  async signupWithGoogle(token: string) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token,
    });

    if (error) throw new Error("Gagal signup dengan Google");

    const userData = data.user!;

    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email! },
    });

    if (existingUser) throw new Error("Email sudah terdaftar");

    const user = await prisma.user.create({
      data: {
        nama:
          userData.user_metadata?.full_name || userData.email!.split("@")[0],
        email: userData.email!,
        role: "PESERTA_MAGANG",
        googleId: userData.id,
      },
    });

    await prisma.pesertaMagang.create({
      data: {
        userId: user.id,
        qrCode: `MAGANG-${user.id}-${Date.now()}`,
      },
    });

    const jwtToken = generateJWT(user.id, user.role);

    return {
      token: jwtToken,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
    };
  }
}

export default new AuthService();
