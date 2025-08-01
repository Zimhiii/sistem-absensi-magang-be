import { Request, Response } from "express";
import { LoginInput, SignupInput } from "../../utils/types";
import authService from "./auth.service";
class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password }: LoginInput = req.body;
      const result = await authService.login(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  async signup(req: Request, res: Response) {
    try {
      const data: SignupInput = req.body;
      const result = await authService.singup(data);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async loginWithGoogle(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const result = await authService.loginWithGoogle(token);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  async signupWithGoogle(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const result = await authService.signupWithGoogle(token);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  // ...existing code...

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email harus diisi" });
      }

      const result = await authService.forgotPassword(email);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, refreshToken, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          error: "Token dan password baru harus diisi",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          error: "Password minimal 6 karakter",
        });
      }

      const result = await authService.resetPassword(
        token,
        refreshToken || "",
        newPassword
      );
      res.json(result);
    } catch (error: any) {
      console.error("Reset password controller error:", error);
      res.status(400).json({ error: error.message });
    }
  }

  // ...existing code...
}

export default new AuthController();
