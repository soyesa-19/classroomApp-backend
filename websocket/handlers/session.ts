import { Socket } from "socket.io";
import { UserScoreService } from "../../services/userScoreService.js";
import { ConnectionManager } from "../services/connectionManager.js";

const connectionManager = ConnectionManager.getInstance();

export const handleSessionEvents = (socket: Socket) => {
  // Join a session
  socket.on("join-session", (sessionId: string) => {
    const { user } = socket.data;

    connectionManager.updateSession(sessionId, user.id, true);

    socket.join(`session:${sessionId}`);
    socket.to(`session:${sessionId}`).emit("user-joined", {
      userId: user.id,
      username: `${user.firstName} ${user.lastName}`,
      timestamp: new Date().toISOString(),
    });
  });

  // Leave a session
  socket.on("leave-session", async (sessionId: string) => {
    const { user } = socket.data;
    connectionManager.updateSession(sessionId, user.id, false);

    socket.leave(`session:${sessionId}`);
    socket.to(`session:${sessionId}`).emit("user-left", user.id);
  });

  // Handle session messages
  socket.on(
    "update-score",
    (data: { sessionId: string; score: number; sectionId: string }) => {
      const { user } = socket.data;
      connectionManager.updateSessionScore({ ...data, userId: user.id });

      socket.to(`session:${data.sessionId}`).emit("score-updated", {
        ...data,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
    }
  );
};
