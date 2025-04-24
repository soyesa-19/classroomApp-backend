import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { authenticateSocket } from "./middleware/auth.js";
import { handleSessionEvents } from "./handlers/session.js";
import { ConnectionManager } from "./services/connectionManager.js";
import { SessionService } from "../services/sessionService.js";

export const initializeWebSocketServer = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Apply authentication middleware
  io.use(authenticateSocket);

  // Handle connections
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.data.user.id}`);
    const connectionManager = ConnectionManager.getInstance();
    connectionManager.addConnection(socket);

    // Initialize event handlers
    handleSessionEvents(socket);

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.data.user.id}`);
      SessionService.leaveSession(socket.data.user.id)
      connectionManager.removeConnection(socket.data.user.id);
    });
  });

  return io;
};
