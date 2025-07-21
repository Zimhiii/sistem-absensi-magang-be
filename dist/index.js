"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const multer_1 = __importDefault(require("multer"));
const auth_controller_js_1 = __importDefault(require("./modules/auth/auth.controller.js"));
const auth_js_1 = require("./middleware/auth.js");
const user_controller_js_1 = __importDefault(require("./modules/user/user.controller.js"));
const kehadiran_controller_js_1 = __importDefault(require("./modules/kehadiran/kehadiran.controller.js"));
const qrcode_controller_js_1 = __importDefault(require("./modules/qrcode/qrcode.controller.js"));
// import authController from "./modules/auth/auth.controller";
// Create a new express application instance
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// Set the network port
const port = process.env.PORT || 3000;
// Define the root path with a greeting message
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the Express + TypeScript Server dsfsdfds!" });
});
// Auth Routes
app.post("/auth/login", auth_controller_js_1.default.login);
app.post("/auth/signup", auth_controller_js_1.default.signup);
app.post("/auth/login/google", auth_controller_js_1.default.loginWithGoogle);
app.post("/auth/signup/google", auth_controller_js_1.default.signupWithGoogle);
// User Routes
app.get("/users/me", auth_js_1.authenticate, user_controller_js_1.default.getProfile);
app.put("/users/me", auth_js_1.authenticate, user_controller_js_1.default.updateProfile);
app.post("/users/me/profile-picture", auth_js_1.authenticate, upload.single("file"), user_controller_js_1.default.updateProfilePicture);
// Admin only routes
app.get("/users", auth_js_1.authenticate, (0, auth_js_1.authorize)(["ADMIN"]), user_controller_js_1.default.getAllUsers);
app.post("/users", auth_js_1.authenticate, (0, auth_js_1.authorize)(["ADMIN"]), user_controller_js_1.default.createUser);
app.put("/users/:id", auth_js_1.authenticate, (0, auth_js_1.authorize)(["ADMIN"]), user_controller_js_1.default.updateUser);
app.delete("/users/:id", auth_js_1.authenticate, (0, auth_js_1.authorize)(["ADMIN"]), user_controller_js_1.default.deleteUser);
//Kehadiran Route
app.post("/kehadiran.record", auth_js_1.authenticate, (0, auth_js_1.authorize)(["PESERTA_MAGANG"]), kehadiran_controller_js_1.default.recordAttendance);
app.post("/kehadiran/scan", auth_js_1.authenticate, (0, auth_js_1.authorize)(["ADMIN", "PEMBIMBING", "SATPAM"]), kehadiran_controller_js_1.default.scanAttendance);
app.get("/kehadiran/history", auth_js_1.authenticate, kehadiran_controller_js_1.default.getAttendanceHistory);
app.post("/kehadiran/izin", auth_js_1.authenticate, (0, auth_js_1.authorize)(["PESERTA_MAGANG"]), kehadiran_controller_js_1.default.requestIzin);
app.post("/kehadiran/validate-izin", auth_js_1.authenticate, (0, auth_js_1.authorize)(["ADMIN", "PEMBIMBING"]), kehadiran_controller_js_1.default.validateIzin);
app.get("/kehadiran/export", auth_js_1.authenticate, (0, auth_js_1.authorize)(["ADMIN", "PEMBIMBING"]), kehadiran_controller_js_1.default.exportAttendance);
//QR Code Routes
app.post("/qrcode/generate", auth_js_1.authenticate, (0, auth_js_1.authorize)(["ADMIN", "PEMBIMBING", "SATPAM"]), qrcode_controller_js_1.default.generateQRCode);
app.get("/qrcode/me", auth_js_1.authenticate, (0, auth_js_1.authorize)(["PESERTA_MAGANG"]), qrcode_controller_js_1.default.getMyQRCode);
app.get("/qrcode/generated", auth_js_1.authenticate, (0, auth_js_1.authorize)(["ADMIN", "PEMBIMBING", "SATPAM"]), qrcode_controller_js_1.default.getGeneratedQRCodes);
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
