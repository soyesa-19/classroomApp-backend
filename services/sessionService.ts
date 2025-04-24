import { CollectionReference } from "firebase-admin/firestore";
import { db, archiveCollectionData } from "./firebase.js";
import type { Classroom, Session, Visibility } from "../types/classroom.js";
import { ConnectionManager } from "../websocket/services/connectionManager.js";

const BOOKING_OFFSET = 3;
export class SessionService {
  private static readonly sessionCollection = db.collection(
    "sessions"
  ) as CollectionReference<Session>;

  static async createSession(
    classroom: Classroom,
    userId: string
  ): Promise<Session> {
    // If no available sessions found, create a new one
    const doc = SessionService.sessionCollection.doc();
    const newSession: Session = {
      id: doc.id,
      status: "active",
      users: [
        {
          id: userId,
        },
      ],
      maxUsers: classroom.maxUsers,
      visibility: "open",
      classroomId: classroom.id,
    };

    await doc.set(newSession);
    return newSession;
  }

  static async getSessionById(id: string): Promise<Session | null> {
    const sessionDoc = await SessionService.sessionCollection.doc(id).get();
    if (!sessionDoc.exists) {
      return null;
    }
    return sessionDoc.data() || null;
  }

  static async getAvailableSessions(
    classroom: Classroom,
    bookedSlots: number
  ): Promise<Session[]> {
    const sessionsSnap = await SessionService.sessionCollection
      .where("classroomId", "==", classroom.id)
      .where("status", "==", "active")
      .where("visibility", "==", "open")
      .get();

    const sessions = sessionsSnap.docs
      .map((doc) => doc.data())
      .filter(
        (session) =>
          session.users.length <
          classroom.maxUsers -
            bookedSlots -
            (bookedSlots > 0 ? BOOKING_OFFSET : 0)
      );

    return sessions;
  }

  static async getActiveSession(sessionId: string) {
    // Validate session exists
    const sessionDoc = await SessionService.sessionCollection
      .doc(sessionId)
      .get();
    const session = sessionDoc?.data();
    if (!session || session.status === "ended") {
      return null;
    }

    return session;
  }

  static async updateSessionVisibility(
    sessionId: string,
    visibility: Visibility
  ) {
    try {
      // Validate session exists
      const sessionData = await SessionService.getActiveSession(sessionId);

      if (!sessionData) {
        throw new Error(
          "Failed to update visibility, Session not exists or ended"
        );
      }

      // Add user to session
      await SessionService.sessionCollection.doc(sessionId).set({
        ...sessionData,
        visibility,
      });
    } catch (error) {
      console.error("Error adding user to session:", error);
      throw error;
    }
  }

  static async updateSessionUsers(
    sessionId: string,
    userIds: string[]
  ): Promise<void> {
    try {
      // Validate session exists
      const sessionData = await SessionService.getActiveSession(sessionId);

      if (!sessionData) {
        throw new Error("Failed to add user, Session not exists");
      }

      const users = sessionData.users;
      const missingUsersIds = userIds.filter(
        (userId) => !users.find((user) => user.id === userId)
      );

      // User is already part of session.
      if (missingUsersIds.length === 0) {
        return;
      }

      // Validate session isn't full
      if (missingUsersIds.length + users.length >= sessionData.maxUsers) {
        throw new Error("Session is full");
      }

      const aggregateUsers = users.concat(
        missingUsersIds.map((userId) => ({
          id: userId,
        }))
      );

      // Add user to session
      await SessionService.sessionCollection.doc(sessionId).set({
        ...sessionData,
        users: aggregateUsers,
      });
    } catch (error) {
      console.error("Error adding user to session:", error);
      throw error;
    }
  }

  static async leaveSession(userId: string) {
    const connectionManager = ConnectionManager.getInstance();
    const connection = connectionManager.getConnection(userId);
    if (!connection) {
      return;
    }
    const { socket, activeSession } = connection;
    if (!activeSession) {
      return;
    }
    const { user } = socket.data;
    connectionManager.updateUserSessionStatus(activeSession, user.id, false);

    console.log("leave-session", activeSession, user.id);
    socket.leave(`session:${activeSession}`);
    socket.to(`session:${activeSession}`).emit("user-left", user.id);

    const [bookingId, record] =
      connectionManager.getBookingBySessionId(activeSession) || [];
    if (bookingId) {
      if (!record.users.has(user.id)) {
        const remainingSlots =
          connectionManager.incrementOpenBookingSlots(bookingId);
        if (remainingSlots === 1) {
          await SessionService.updateSessionVisibility(activeSession, "open");
          return;
        }
      }
    }
  }

  static async endSession(sessionId: string): Promise<void> {
    try {
      // Validate session exists
      const sessionData = await SessionService.getActiveSession(sessionId);

      if (!sessionData) {
        throw new Error("Failed to end session, Session not exists");
      }

      // End session
      await SessionService.sessionCollection.doc(sessionId).set({
        ...sessionData,
        status: "ended",
      });
    } catch (error) {
      console.error("Error ending session:", error);
      throw error;
    }
  }

  static async archiveSessions(batchSize: number = 500): Promise<void> {
    await archiveCollectionData("sessions", batchSize);
  }
}
