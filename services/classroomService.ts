import { CollectionReference } from "firebase-admin/firestore";
import { db } from "./firebase.js";
import { Session, type Classroom } from "../types/classroom.js";
import { SessionService } from "./sessionService.js";
import { UserScoreService } from "./userScoreService.js";
import { SectionService } from "./sectionService.js";

export class ClassroomService {
  private static readonly classroomCollection = db.collection(
    "classrooms"
  ) as CollectionReference<Classroom>;

  static async joinClassroom(classroomId: string, userId: string) {
    const classroom = await ClassroomService.getClassroomById(classroomId);
    if (!classroom) {
      throw new Error("No classroom found for this id");
    }

    // Validate classroom
    await ClassroomService.isClassroomValid(classroom);

    // Check for existing sessions
    const existingSessions = await SessionService.getAvailableSessions(
      classroom
    );
    const existingUserSession = existingSessions.find((session) =>
      session.users.find((userSessionStatus) => userSessionStatus.id === userId)
    );

    // Take sessionId from existing user session,
    // OR take sessionId from existing available session
    let session: Session | undefined =
      existingUserSession || existingSessions?.[0];
    if (!session) {
      session = await SessionService.createSession(classroom, userId);
    }
    const sessionScores = await UserScoreService.getScoresForSession(
      session.id
    );

    return {
      session,
      scores: sessionScores,
    };
  }

  static async leaveClassroom(classroomId: string, userId: string) {}

  static async getClassroomById(id: string): Promise<Classroom | null> {
    const classroomDoc = await ClassroomService.classroomCollection
      .doc(id)
      .get();
    if (!classroomDoc.exists) {
      return null;
    }
    return classroomDoc.data() || null;
  }

  static async isClassroomValid(classroom: Classroom): Promise<boolean> {
    const now = new Date();
    const classroomStartTime = new Date(classroom.startTime);
    const classroomEndTime = new Date(classroom.startTime);
    classroomEndTime.setMinutes(
      classroomEndTime.getMinutes() + classroom.duration
    );
    console.log(now, classroomStartTime, classroomEndTime);

    if (now < classroomStartTime) {
      throw new Error("classroom has not started yet");
    }

    if (now > classroomEndTime) {
      throw new Error("classroom already ended");
    }

    if (classroom.visibility !== "open") {
      throw new Error("classroom is private, you cannot join!");
    }

    return true;
  }

  static async getSectionsForClassroomId(classroomId: string) {
    const classroom = await ClassroomService.getClassroomById(classroomId);
    if (!classroom) {
      return null;
    }
    return ClassroomService.getSectionsForClassroom(classroom);
  }

  static async getSectionsForClassroom(classroom: Classroom) {
    return SectionService.getSectionsByIds(classroom.sections);
  }

  static async createClassroom(
    classroomData: Omit<Classroom, "id">
  ): Promise<string> {
    const doc = ClassroomService.classroomCollection.doc();
    doc.set({ id: doc.id, ...classroomData });
    return doc.id;
  }

  static async getAllClassrooms(): Promise<Classroom[]> {
    const classrooms = await this.classroomCollection.get();
    return classrooms.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
  }
}
