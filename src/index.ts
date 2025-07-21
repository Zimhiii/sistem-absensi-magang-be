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
import prisma from "./config/prisma.js";
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
  "/kehadiran.record",
  authenticate,
  authorize(["PESERTA_MAGANG"]),
  kehadiranController.recordAttendance
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

const PORT = process.env.PORT || 3000;
// Start the Express server
app.listen(port, () => {
  console.log(`The server is running at http://localhost:${PORT}`);
});
// async function startServer() {
//   try {
//     await prisma.$connect();
//     console.log("Database connected");

//     app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   } catch (error) {
//     console.error("Failed to connect to database", error);
//     process.exit(1);
//   }
// }

// startServer();

// // Handle shutdown
// process.on("SIGINT", async () => {
//   await prisma.$disconnect();
//   process.exit(0);
// });

// process.on("SIGTERM", async () => {
//   await prisma.$disconnect();
//   process.exit(0);
// });
