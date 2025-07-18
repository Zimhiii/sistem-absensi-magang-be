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
}

export default new AuthController();
