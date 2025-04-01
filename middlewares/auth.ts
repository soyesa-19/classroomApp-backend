import { Response } from "express";
import AuthService from "../services/authService.js";
import { AuthenticatedRequest } from "../types/auth.js";

export async function authorizeRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: () => void
) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const { valid, data } = await AuthService.validateToken(token);
  if (valid) {
    req.user = data;
    next();
  } else {
    res.status(401).json({ message: "Token is not valid" });
  }
}
