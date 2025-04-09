import { CollectionReference } from "firebase-admin/firestore";
import { Section } from "../types/classroom.js";
import { db } from "./firebase.js";

export class SectionService {
  private static readonly sectionCollection = db.collection(
    "sections"
  ) as CollectionReference<Section>;

  static async getSectionsByIds(ids: string[]): Promise<Section[]> {
    const docRefs = ids.map((id) => SectionService.sectionCollection.doc(id));

    const sectionSnaps = await db.getAll(...docRefs);

    return sectionSnaps
      .filter((snap) => snap.exists)
      .map((snap) => snap.data() as Section);
  }
}
