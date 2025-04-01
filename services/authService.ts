import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../types/users.js";
import UserService from "./userService.js";
import { JwtTokenPayload, LoginResponse } from "../types/auth.js";
import assert from "node:assert";

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

const JWT_TOKEN_EXPIRY = "1h";
function getJwtSecret() {
  assert(process.env.JWT_SECRET, "JWT_SECRET is not defined");
  return process.env.JWT_SECRET;
}

function verifyAsync(token: string) {
  const JWT_SECRET = getJwtSecret();
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, payload) => {
      if (err) {
        reject(err);
      } else {
        resolve(payload);
      }
    });
  });
}

class AuthService {
  static async register(
    userData: z.infer<typeof RegisterSchema>
  ): Promise<Omit<User, "passwordHash">> {
    const validatedData = RegisterSchema.parse(userData);

    const existingUser = await UserService.getUserByEmail(userData.email);

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    const newUser: Omit<User, "id"> = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      passwordHash,
    };

    const { passwordHash: _, ...userWithoutHash } =
      await UserService.createUser(newUser);

    return userWithoutHash;
  }

  static async login(
    loginData: z.infer<typeof LoginSchema>
  ): Promise<LoginResponse> {
    const validatedData = LoginSchema.parse(loginData);
    const JWT_SECRET = getJwtSecret();

    const user = await UserService.getUserByEmail(validatedData.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const { passwordHash, ...userWithoutHash } = user;

    const isMatch = await bcrypt.compare(validatedData.password, passwordHash);

    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    const payload: JwtTokenPayload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_TOKEN_EXPIRY,
    });

    return { token, user: userWithoutHash };
  }

  static async validateToken(token: string) {
    try {
      const decoded = (await verifyAsync(token)) as JwtTokenPayload;
      return {
        valid: true,
        data: decoded,
      };
    } catch (error) {
      return {
        valid: false,
        data: null,
      };
    }
  }
}

export default AuthService;
