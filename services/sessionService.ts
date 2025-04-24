import { CollectionReference } from "firebase-admin/firestore";
import { db } from "./firebase.js";
import type { Classroom, Session } from "../types/classroom.js";

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

  static async getAvailableSessions(classroom: Classroom): Promise<Session[]> {
    const sessionsSnap = await SessionService.sessionCollection
      .where("classroomId", "==", classroom.id)
      .where("status", "==", "active")
      .where("visibility", "==", "open")
      .get();

    const sessions = sessionsSnap.docs
      .map((doc) => doc.data())
      .filter((session) => session.users.length < classroom.maxUsers);

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
}
