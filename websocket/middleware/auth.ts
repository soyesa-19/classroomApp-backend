import { Socket } from "socket.io";
import { extractToken, validateAuthToken } from "../../services/authUtils.js";

export const authenticateSocket = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      extractToken(socket.handshake.auth) ||
      extractToken(socket.handshake.headers);

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const { valid, data } = await validateAuthToken(token);

    if (!valid || !data) {
      return next(new Error("Invalid authentication token"));
    }

    // Attach user data to socket
    socket.data.user = data;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
};
