import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth.js";
import { extractToken, validateAuthToken } from "../services/authUtils.js";

export async function authorizeRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: () => void
) {
  const token = extractToken(req.headers);

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const { valid, data } = await validateAuthToken(token);

  if (!valid || !data) {
    return res.status(401).json({ message: "Token is not valid" });
  }

  req.user = data;
  next();
}
