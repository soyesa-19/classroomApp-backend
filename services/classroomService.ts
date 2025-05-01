import { CollectionReference, Timestamp } from "firebase-admin/firestore";
import { db } from "./firebase.js";
import type { Session, Classroom, Booking } from "../types/classroom.js";
import { SessionService } from "./sessionService.js";
import { UserScoreService } from "./userScoreService.js";
import { SectionService } from "./sectionService.js";
import { CronTaskService } from "./cronService.js";
import {
  createEndOfDayCronPattern,
  timestampToCron,
} from "../js/utils/cronUtils.js";
import {
  archiveSessionData,
  endSession,
  persistUsersAndScoresData,
} from "../cronTasks.js";
import { ConnectionManager } from "../websocket/services/connectionManager.js";

const END_SESSION_OFFSET = 5 * 60 * 1000; // 5 minutes

export class ClassroomService {
  private static readonly classroomCollection = db.collection(
    "classrooms"
  ) as CollectionReference<Classroom>;

  static async joinClassroom(
    classroomId: string,
    userId: string,
    booking?: Booking
  ) {
    const classroom = await ClassroomService.getClassroomById(classroomId);

    const connectionManager = ConnectionManager.getInstance();
    if (!classroom) {
      throw new Error("No classroom found for this id");
    }
    // Validate classroom
    await ClassroomService.isClassroomValid(classroom);

    const bookedSessionId =
      booking && connectionManager.getBooking(booking.id)?.sessionId;
    let bookedSession;

    if (bookedSessionId) {
      bookedSession = await SessionService.getSessionById(bookedSessionId);
    }

    let existingUserSession;
    let existingSessions;

    if (!bookedSession) {
      // Check for existing sessions
      existingSessions = await SessionService.getAvailableSessions(
        classroom,
        booking?.userCount || 0
      );
      existingUserSession = existingSessions.find((session) =>
        session.users.find(
          (userSessionStatus) => userSessionStatus.id === userId
        )
      );
    }

    // Take sessionId from existing user session,
    // OR take sessionId from existing available session
    let session: Session | undefined =
      bookedSession || existingUserSession || existingSessions?.[0];

    if (!session) {
      session = await SessionService.createSession(classroom, userId);
    }
    const sessionScores = await UserScoreService.getScoresForSession(
      session.id
    );
    const sections = await ClassroomService.getSectionsForClassroomId(
      classroomId
    );

    // Register the booking if user is first to join booked session
    if (booking && !bookedSession) {
      connectionManager.addBooking(booking.id, {
        openSlots: classroom.maxUsers - booking.userCount,
        sessionId: session.id,
      });
      connectionManager.addUserToBooking(booking.id, userId);
    }

    // Add the user to booking list if he joins by booking workflow.
    if (booking && bookedSession) {
      connectionManager.addUserToBooking(booking.id, userId);
    }

    CronTaskService.scheduleTask(
      `endSession-${session.id}`,
      timestampToCron(classroom.startTime.toMillis() + END_SESSION_OFFSET),
      () => endSession(session.id)
    );
    sections?.forEach((section) => {
      CronTaskService.scheduleTask(
        `endSection-${section.id}`,
        timestampToCron(
          classroom.startTime.toMillis() + section.durationInMinutes * 60 * 1000
        ),
        () => persistUsersAndScoresData(session.id, section.id)
      );
    });

    if (!CronTaskService.taskExists("archiveSessionData")) {
      CronTaskService.scheduleTask(
        "archiveSessionData",
        createEndOfDayCronPattern(classroom.startTime),
        archiveSessionData
      );
    }

    return {
      session,
      scores: sessionScores,
      sections,
      startTime: classroom.startTime,
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
    const now = new Date().getTime();
    const classroomStartTime = classroom.startTime.toDate().getTime();
    const classroomEndTime =
      classroom.startTime.toDate().getTime() +
      classroom.durationInMinutes * 60 * 1000;

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
    return classrooms.docs.map((doc) => doc.data());
  }
}
