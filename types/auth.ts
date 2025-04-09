import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { User } from "./users.js";

export type LoginResponse = {
  token: string;
  user: Omit<User, "passwordHash">;
};

export type RegisterResponse = {
  user: Omit<User, "passwordHash">;
};

export interface JwtTokenPayload extends JwtPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtTokenPayload;
}
