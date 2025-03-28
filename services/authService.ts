import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Request, Response } from "express";

export const RegisterSchema = z.object({
  firstName: z.string().min(3, "Username must be at least 3 characters"),
  lastName: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
}

const JWT_SECRET = "your_jwt_secret_key_here";

const USERS_FILE_PATH = path.join(process.cwd(), "users.json");

class AuthService {
  static async readUsers(): Promise<User[]> {
    try {
      const usersData = await fs.readFile(USERS_FILE_PATH, "utf-8");
      return JSON.parse(usersData);
    } catch (error) {
      return [];
    }
  }

  static async writeUsers(users: User[]): Promise<void> {
    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2));
  }

  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static async register(
    userData: z.infer<typeof RegisterSchema>
  ): Promise<Omit<User, "passwordHash">> {
    const validatedData = RegisterSchema.parse(userData);

    const users = await this.readUsers();

    const existingUser = users.find((u) => u.email === validatedData.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    const newUser: User = {
      id: this.generateId(),
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      passwordHash,
    };

    users.push(newUser);
    await this.writeUsers(users);

    const { passwordHash: _, ...userWithoutHash } = newUser;
    return userWithoutHash;
  }

  static async login(loginData: z.infer<typeof LoginSchema>): Promise<string> {
    const validatedData = LoginSchema.parse(loginData);

    const users = await this.readUsers();

    const user = users.find((u) => u.email === validatedData.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(
      validatedData.password,
      user.passwordHash
    );
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    return token;
  }

  static async verifyRequest(req: Request, res: Response, next: () => void) {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: "Token is not valid" });
    }
  }
}

export default AuthService;
