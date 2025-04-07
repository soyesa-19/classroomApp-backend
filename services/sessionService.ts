import { CollectionReference } from "firebase-admin/firestore";
import { db } from "./firebase.js";
import { type Session } from "../types/classroom.js";
import ClassroomService from "./classroomService.js";

class SessionService {
  private static readonly sessionCollection = db.collection(
    "sessions"
  ) as CollectionReference<Session>;

  static async createSession(
    classroomId: string,
    userId: string
  ): Promise<{ sessionId: string; message: string }> {
    // Get classroom data
    const classroom = await ClassroomService.getClassroomById(classroomId);
    if (!classroom) {
      throw new Error("No classroom found for this id");
    }

    // Validate classroom
    await ClassroomService.isClassroomValid(classroom);

    // Check for existing sessions
    const existingSessions = await this.getSessionsByClassroomId(classroomId);

    if (existingSessions.length > 0) {
      // Find the most recent session that isn't full
      const rejoinUser = existingSessions.find((session) =>
        session.users.includes(userId)
      );
      if (rejoinUser) {
        return {
          sessionId: rejoinUser.id,
          message: "User rejoined to session",
        };
      }
      const availableSession = existingSessions.find(
        (session) => session.users.length < classroom.maxusers
      );

      if (availableSession) {
        // Add user to available session if not already present
        if (!availableSession.users.includes(userId)) {
          await this.addUserToSession(availableSession.id, userId);
        }
        return {
          sessionId: availableSession.id,
          message: "Added to existing session",
        };
      }
    }

    // If no available sessions found, create a new one
    const doc = await this.sessionCollection.doc();
    const newSession: Session = {
      id: doc.id,
      users: [userId],
      max_score: 0,
      visibility: true,
      classroom_id: classroomId,
    };

    await doc.set(newSession);
    return {
      sessionId: doc.id,
      message: "New session created",
    };
  }

  private static async getSessionsByClassroomId(
    classroomId: string
  ): Promise<Session[]> {
    const query = await this.sessionCollection
      .where("classroom_id", "==", classroomId)
      .orderBy("users", "asc") // Order by number of users to find less populated sessions first
      .get();

    return query.docs.map((doc) => doc.data() as Session);
  }

  private static async addUserToSession(
    sessionId: string,
    userId: string
  ): Promise<void> {
    const session = await this.sessionCollection.doc(sessionId).get();
    const sessionData = session.data() as Session;
    await this.sessionCollection.doc(sessionId).update({
      users: [...sessionData.users, userId],
    });
  }
}

export default SessionService;
