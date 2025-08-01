import { Request, Response } from "express";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import multer from "multer";
import authController from "./modules/auth/auth.controller.js";
import { authenticate, authorize } from "./middleware/auth.js";
import userController from "./modules/user/user.controller.js";
import kehadiranController from "./modules/kehadiran/kehadiran.controller.js";
import qrcodeController from "./modules/qrcode/qrcode.controller.js";
import { VercelRequest, VercelResponse } from "@vercel/node";
import prisma from "./config/prisma.js";
import pembimbingController from "./modules/pembimbing/pembimbing.controller.js";
import satpamController from "./modules/satpam/satpam.controller.js";
import { errorHandler } from "./middleware/errorHandler.js";
// import authController from "./modules/auth/auth.controller";
// Create a new express application instance
const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set the network port
const port = process.env.PORT || 3000;

// Define the root path with a greeting message
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the Express + TypeScript Server dsfsdfds!" });
});

// Auth Routes
app.post("/auth/login", authController.login);
app.post("/auth/signup", authController.signup);
app.post("/auth/login/google", authController.loginWithGoogle);
app.post("/auth/signup/google", authController.signupWithGoogle);
app.post("/auth/forgot-password", authController.forgotPassword);
app.post("/auth/reset-password", authController.resetPassword);

// User Routes
app.get("/users/me", authenticate, userController.getProfile);
app.put("/users/me", authenticate, userController.updateProfile);
app.post(
  "/users/me/profile-picture",
  authenticate,
  upload.single("file"),
  userController.updateProfilePicture
);

// Admin only routes
app.get(
  "/users",
  authenticate,
  authorize(["ADMIN"]),
  userController.getAllUsers
);
app.post(
  "/users",
  authenticate,
  authorize(["ADMIN"]),
  userController.createUser
);
app.put(
  "/users/:id",
  authenticate,
  authorize(["ADMIN"]),
  userController.updateUser
);
app.delete(
  "/users/:id",
  authenticate,
  authorize(["ADMIN"]),
  userController.deleteUser
);

//Kehadiran Route
app.post(
  "/kehadiran/record",
  authenticate,
  authorize(["PESERTA_MAGANG"]),
  kehadiranController.recordAttendance
);

// Request izin (Peserta Magang)
app.post(
  "/kehadiran/request-izin",
  authenticate,
  authorize(["PESERTA_MAGANG"]),
  kehadiranController.requestIzin
);

// Validasi izin (Pembimbing & Admin)
app.post(
  "/kehadiran/validate-izin",
  authenticate,
  authorize(["ADMIN", "PEMBIMBING"]),
  kehadiranController.validateIzin
);

// Riwayat izin saya (Peserta Magang)
app.get(
  "/kehadiran/my-izin-history",
  authenticate,
  authorize(["PESERTA_MAGANG"]),
  kehadiranController.getMyIzinHistory
);

// Izin pending untuk divalidasi (Pembimbing)
app.get(
  "/kehadiran/izin/pending",
  authenticate,
  authorize(["PEMBIMBING"]),
  kehadiranController.getPendingIzin
);

// Riwayat semua izin peserta bimbingan (Pembimbing)
app.get(
  "/kehadiran/izin/history",
  authenticate,
  authorize(["PEMBIMBING"]),
  kehadiranController.getAllIzinHistory
);

// Semua izin untuk admin (Admin only)
app.get(
  "/kehadiran/izin/admin/all",
  authenticate,
  authorize(["ADMIN"]),
  kehadiranController.getAllIzinForAdmin
);

app.post(
  "/kehadiran/scan",
  authenticate,
  authorize(["ADMIN", "PEMBIMBING", "SATPAM"]),
  kehadiranController.scanAttendance
);

app.get(
  "/kehadiran/history",
  authenticate,
  kehadiranController.getAttendanceHistory
);

app.post(
  "/kehadiran/izin",
  authenticate,
  authorize(["PESERTA_MAGANG"]),
  kehadiranController.requestIzin
);
app.post(
  "/kehadiran/validate-izin",
  authenticate,
  authorize(["ADMIN", "PEMBIMBING"]),
  kehadiranController.validateIzin
);
app.get(
  "/kehadiran/export",
  authenticate,
  authorize(["ADMIN", "PEMBIMBING"]),
  kehadiranController.exportAttendance
);

// Export attendance semua peserta berdasarkan instansi (Admin only)
app.get(
  "/kehadiran/export/all-by-instansi",
  authenticate,
  authorize(["ADMIN"]),
  kehadiranController.exportAllAttendanceByInstansi
);

// Export summary attendance berdasarkan instansi (Admin only)
app.get(
  "/kehadiran/export/summary-by-instansi",
  authenticate,
  authorize(["ADMIN"]),
  kehadiranController.exportSummaryByInstansi
);

// Get daftar instansi untuk filter (Admin & Pembimbing)
app.get(
  "/kehadiran/instansi",
  authenticate,
  authorize(["ADMIN", "PEMBIMBING"]),
  kehadiranController.getDaftarInstansi
);

// Export rekap kehadiran semua peserta dalam format matrix (Admin & Pembimbing)
app.get(
  "/kehadiran/export/rekap-all",
  authenticate,
  authorize(["ADMIN", "PEMBIMBING"]),
  kehadiranController.exportRekapKehadiranAll
);

//QR Code Routes
app.post(
  "/qrcode/generate",
  authenticate,
  authorize(["ADMIN", "PEMBIMBING", "SATPAM"]),
  qrcodeController.generateQRCode
);
app.get(
  "/qrcode/me",
  authenticate,
  authorize(["PESERTA_MAGANG"]),
  qrcodeController.getMyQRCode
);
app.get(
  "/qrcode/generated",
  authenticate,
  authorize(["ADMIN", "PEMBIMBING", "SATPAM"]),
  qrcodeController.getGeneratedQRCodes
);

//Pembimbing Routes
app.get(
  "/pembimbing/students",
  authenticate,
  authorize(["PEMBIMBING"]),
  pembimbingController.getMyStudents
);

app.get(
  "/pembimbing",
  authenticate,
  authorize(["PESERTA_MAGANG", "ADMIN"]),
  pembimbingController.getAllPembimbing
);

app.post(
  "/pembimbing/select",
  authenticate,
  authorize(["PESERTA_MAGANG"]),
  pembimbingController.selectPembimbing
);

app.post(
  "/pembimbing/verify-students",
  authenticate,
  authorize(["PEMBIMBING"]),
  pembimbingController.verifiyStudent
);
app.post(
  "/pembimbing/grant-permission",
  authenticate,
  authorize(["PEMBIMBING"]),
  pembimbingController.grantSatpamPermission
);

//Satpam Routes
app.get(
  "/satpam/permissions",
  authenticate,
  authorize(["SATPAM"]),
  satpamController.getPermissions
);

app.use(errorHandler);

// Start the Express server
// app.listen(port, () => {
//   console.log(`The server is running at http://localhost:${PORT}`);
// });

const os = require("os");
function getWifiIP(): string | null {
  const interfaces = os.networkInterfaces();

  // Cari interface WiFi (biasanya bernama 'Wi-Fi' di Windows)
  const wifiInterface = interfaces["Wi-Fi"] || interfaces["wlan0"]; // 'wlan0' untuk Linux

  if (wifiInterface) {
    for (const iface of wifiInterface) {
      // Ambil IPv4 yang bukan internal
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }

  return null; // Jika tidak ditemukan
}

const wifiIP = getWifiIP();
console.log("WiFi IP Address:", wifiIP || "Tidak terdeteksi");

async function startServer() {
  try {
    const port = 3000;
    await prisma.$connect();
    console.log("Database connected");
    console.log(`- Local:    http://localhost:${port}`);
    console.log(`- Wifi Network:  http://${wifiIP}:${port}`);

    app.listen(port, "0.0.0.0", () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to database", error);
    process.exit(1);
  }
}

startServer();

// Handle shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Export handler khusus untuk Vercel
export default (req: VercelRequest, res: VercelResponse) => {
  app(req as any, res as any);
};
