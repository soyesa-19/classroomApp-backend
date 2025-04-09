import { Socket } from "socket.io";
import { ConnectionManager } from "../services/connectionManager.js";
import { UserScoreService } from "../../services/userScoreService.js";

const connectionManager = ConnectionManager.getInstance();

export const handleSessionEvents = (socket: Socket) => {
  // Join a session
  socket.on("join-session", (sessionId: string) => {
    const { user } = socket.data;
    connectionManager.updateUserSessionStatus(sessionId, user.id, true);

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
    connectionManager.updateUserSessionStatus(sessionId, user.id, false);

    socket.leave(`session:${sessionId}`);
    socket.to(`session:${sessionId}`).emit("user-left", user.id);
  });

  // Handle session messages
  socket.on(
    "update-score",
    async (data: { sessionId: string; score: number; sectionId: string }) => {
      const { user } = socket.data;
      const sessionScore = connectionManager.getSessionScore(data.sessionId);
      const sessionSectionScore = connectionManager.getSessionSectionScore(
        data.sessionId,
        data.sectionId
      );

      // For persisting scores on section change.
      if (sessionScore && sessionScore.size && !sessionSectionScore) {
        await UserScoreService.writeBulkUserScoreForSession(
          data.sessionId,
          sessionScore
        );
      }
      connectionManager.updateSessionScore({ ...data, userId: user.id });
      socket.to(`session:${data.sessionId}`).emit("score-updated", {
        ...data,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
    }
  );
};
