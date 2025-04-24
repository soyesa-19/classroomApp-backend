import { Socket } from "socket.io";
import { ConnectionManager } from "../services/connectionManager.js";
import { UserScoreService } from "../../services/userScoreService.js";
import { SessionService } from "../../services/sessionService.js";
import UserService from "../../services/userService.js";

const connectionManager = ConnectionManager.getInstance();

export const handleSessionEvents = (socket: Socket) => {
  // Join a session
  socket.on("join-session", async (sessionId: string, cb) => {
    const { user } = socket.data;

    connectionManager.updateUserSessionStatus(sessionId, user.id, true);

    socket.join(`session:${sessionId}`);
    socket.to(`session:${sessionId}`).emit("user-joined", {
      userId: user.id,
      username: `${user.firstName} ${user.lastName}`,
      timestamp: new Date().toISOString(),
      currentUser: false,
    });
    const sessionUsers = connectionManager.getActiveSessionUsers(sessionId);
    const userDetails = await UserService.getUsers(sessionUsers);
    const sessionUserDetails = userDetails.map((userDetail) => ({
      userId: userDetail.id,
      username: userDetail.firstName + " " + userDetail.lastName,
      timestamp: new Date().toISOString(),
    }));
    cb(sessionUserDetails);

    const [bookingId, record] =
      connectionManager.getBookingBySessionId(sessionId) || [];
    if (bookingId) {
      if (!record.users.has(user.id)) {
        const remainingSlots =
          connectionManager.decrementOpenBookingSlots(bookingId);
        if (remainingSlots === 0) {
          await SessionService.updateSessionVisibility(sessionId, "restricted");
          return;
        }
      }
    }
  });

  // Leave a session
  socket.on("leave-session", async (sessionId: string) => {
    const { user } = socket.data;
    await SessionService.leaveSession(user.id);
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
