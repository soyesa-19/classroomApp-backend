import { CollectionReference } from "firebase-admin/firestore";
import { db } from "./firebase.js";
import { type classroom } from "../types/classroom.js";

class ClassroomService {
  private static readonly classroomCollection = db.collection(
    "classrooms"
  ) as CollectionReference<classroom>;

  static async getClassroomById(id: string): Promise<classroom | null> {
    const classroomDoc = await this.classroomCollection.doc(id).get();
    if (!classroomDoc.exists) {
      return null;
    }
    return classroomDoc.data() as classroom;
  }

  static async isClassroomValid(classroom: classroom): Promise<boolean> {
    const now = new Date();
    const classroomStartTime = new Date(classroom.start_time);
    const classroomEndTime = new Date(classroom.start_time);
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

    if (!classroom.visibility) {
      throw new Error("classroom is private, you cannot join!");
    }

    return true;
  }

  static async createClassroom(
    classroomData: Omit<classroom, "id">
  ): Promise<string> {
    const doc = await this.classroomCollection.add(classroomData as classroom);
    return doc.id;
  }
}

export default ClassroomService;
