import { JwtTokenPayload } from "../types/auth.js";
import AuthService from "./authService.js";

/**
 * Core authentication logic that can be used by both HTTP and WebSocket middleware
 * @param token - The JWT token to validate
 * @returns The validated token data or null if invalid
 */
export async function validateAuthToken(
  token: string | undefined | null
): Promise<{ valid: boolean; data: JwtTokenPayload | null }> {
  if (!token) {
    return { valid: false, data: null };
  }

  return await AuthService.validateToken(token);
}

/**
 * Extracts a token from various sources
 * @param tokenSource - The source to extract the token from
 * @returns The extracted token or undefined
 */
export function extractToken(
  tokenSource: string | { [key: string]: string | string[] | undefined } | null
): string | undefined {
  if (typeof tokenSource === "string") {
    return tokenSource;
  }

  if (tokenSource && typeof tokenSource === "object") {
    // Handle Authorization header
    if ("authorization" in tokenSource) {
      const authHeader = tokenSource.authorization;
      if (typeof authHeader === "string") {
        return authHeader.replace("Bearer ", "");
      }
    }

    // Handle socket.io auth object
    if ("token" in tokenSource && typeof tokenSource.token === "string") {
      return tokenSource.token;
    }
  }

  return undefined;
}
