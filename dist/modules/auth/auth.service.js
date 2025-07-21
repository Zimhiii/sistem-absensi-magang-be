"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../config/prisma"));
const supabase_1 = __importDefault(require("../../config/supabase"));
const helpers_1 = require("../../utils/helpers");
class AuthService {
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.default.auth.signInWithPassword({
                email,
                password,
            });
            if (error)
                throw new Error("Email atau password salah");
            const user = yield prisma_1.default.user.findUnique({
                where: {
                    email,
                },
                include: {
                    pesertaMagang: true,
                    pembimbing: true,
                    satpam: true,
                },
            });
            if (!user)
                throw new Error("User tidak ditemukan");
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
        });
    }
    singup(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: supabaseUser, error } = yield supabase_1.default.auth.signUp({
                email: data.email,
                password: data.password,
            });
            if (error)
                throw new Error(error.message);
            const user = yield prisma_1.default.user.create({
                data: {
                    nama: data.nama,
                    email: data.email,
                    asalInstansi: data.asalInstansi,
                    nomorTelepon: data.nomorTelepon,
                    role: "PESERTA_MAGANG",
                },
            });
            yield prisma_1.default.pesertaMagang.create({
                data: {
                    userId: user.id,
                    qrCode: `MAGANG-${user.id}-${Date.now()}`,
                },
            });
            const token = (0, helpers_1.generateJWT)(user.id, user.role);
            return {
                token,
                user: {
                    id: user.id,
                    nama: user.nama,
                    email: user.email,
                    role: user.role,
                },
            };
        });
    }
    loginWithGoogle(token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { data, error } = yield supabase_1.default.auth.signInWithIdToken({
                provider: "google",
                token,
            });
            if (error)
                throw new Error(error.message);
            const user = yield prisma_1.default.user.findUnique({
                where: { email: (_a = data.user) === null || _a === void 0 ? void 0 : _a.email },
                include: {
                    pesertaMagang: true,
                    pembimbing: true,
                    satpam: true,
                },
            });
            if (!user)
                throw new Error("User tidak ditemukan");
            const jwtToken = (0, helpers_1.generateJWT)(user.id, user.role);
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
        });
    }
    signupWithGoogle(token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { data, error } = yield supabase_1.default.auth.signInWithIdToken({
                provider: "google",
                token,
            });
            if (error)
                throw new Error("Gagal signup dengan Google");
            const userData = data.user;
            const existingUser = yield prisma_1.default.user.findUnique({
                where: { email: userData.email },
            });
            if (existingUser)
                throw new Error("Email sudah terdaftar");
            const user = yield prisma_1.default.user.create({
                data: {
                    nama: ((_a = userData.user_metadata) === null || _a === void 0 ? void 0 : _a.full_name) || userData.email.split("@")[0],
                    email: userData.email,
                    role: "PESERTA_MAGANG",
                    googleId: userData.id,
                },
            });
            yield prisma_1.default.pesertaMagang.create({
                data: {
                    userId: user.id,
                    qrCode: `MAGANG-${user.id}-${Date.now()}`,
                },
            });
            const jwtToken = (0, helpers_1.generateJWT)(user.id, user.role);
            return {
                token: jwtToken,
                user: {
                    id: user.id,
                    nama: user.nama,
                    email: user.email,
                    role: user.role,
                },
            };
        });
    }
}
exports.default = new AuthService();
