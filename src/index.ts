import { Request, Response } from "express";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import multer from "multer";
import authController from "./modules/auth/auth.controller";
import { authenticate, authorize } from "./middleware/auth";
import userController from "./modules/user/user.controller";
import kehadiranController from "./modules/kehadiran/kehadiran.controller";
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

// Start the Express server
app.listen(port, () => {
  console.log(`The server is running at http://localhost:${port}`);
});
