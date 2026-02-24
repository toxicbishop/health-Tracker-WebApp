import { Router, Request, Response, NextFunction } from "express";
import { authService } from "../services/authService";
import { validate } from "../middleware/validate";
import { RegisterSchema, LoginSchema } from "../validations/authValidation";

const router = Router();

router.post(
  "/register",
  validate(RegisterSchema as any),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;
      const { userId } = await authService.register(username, password);
      res.status(201).json({ message: "User registered successfully", userId });
    } catch (error: any) {
      if (error.message === "Username already exists") {
        res.status(409).json({ status: "fail", message: error.message });
        return;
      }
      next(error);
    }
  },
);

router.post(
  "/login",
  validate(LoginSchema as any),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;
      const { token, userId } = await authService.login(username, password);
      res.json({ message: "Login successful", token, userId });
    } catch (error: any) {
      if (error.message === "Invalid username or password") {
        res.status(401).json({ status: "fail", message: error.message });
        return;
      }
      next(error);
    }
  },
);

export default router;
