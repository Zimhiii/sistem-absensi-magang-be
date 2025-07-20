export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  nama: string;
  email: string;
  asalInstansi: string;
  nomorTelepon: string;
  password: string;
}

export interface UpdateProfileInput {
  nama: string;
  nomorTelepon: string;
  asalInstansi?: string;
}

export interface UpdatePasswordInput {
  password: string;
  newPassword: string;
}

import { Role } from "@prisma/client";

export interface UpdateProfileInput {
  nama: string;
  nomorTelepon: string;
  asalInstansi?: string;
}

export interface CreateUserInput {
  nama: string;
  email: string;
  role: Role;
  nomorTelepon?: string;
}

export interface RecordAttendanceInput {
  qrCode: string;
  type: "MASUK" | "PULANG";
}

export interface ScanAttendanceInput {
  qrCode: string;
  type: "MASUK" | "PULANG";
}

export interface RequestIzinInput {
  alasan: string;
  tanggal: string;
  jenis: "IZIN" | "SAKIT";
}

export interface ValidateIzinInput {
  izinId: string;
  status: "APPROVED" | "REJECTED";
}
