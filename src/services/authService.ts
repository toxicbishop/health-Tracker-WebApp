import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { googleSheetsService } from "./googleSheetsService";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretfallbackkey"; // Better to have this in .env

export class AuthService {
  async register(
    username: string,
    password: string,
  ): Promise<{ userId: string }> {
    // Check if user already exists
    const existingUser = await googleSheetsService.getUserByUsername(username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate unique ID
    const userId = "u_" + Math.random().toString(36).substring(2, 9);

    // Save user
    await googleSheetsService.createUser(userId, username, passwordHash);

    return { userId };
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ token: string; userId: string }> {
    const user = await googleSheetsService.getUserByUsername(username);
    if (!user) {
      throw new Error("Invalid username or password");
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid username or password");
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.userId, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    return { token, userId: user.userId };
  }
}

export const authService = new AuthService();
