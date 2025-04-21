import {
  CollectionReference,
  DocumentReference,
} from "firebase-admin/firestore";
import { db, archiveCollectionData } from "./firebase.js";
import type {
  SessionScores,
  SessionSectionUserScore,
} from "../types/userScores.js";

export class UserScoreService {
  private static readonly userScoresCollection = db.collection(
    "userScores"
  ) as CollectionReference<SessionSectionUserScore>;

  static async getScoresForSession(sessionId: string): Promise<SessionScores> {
    const userScoresDoc = await this.userScoresCollection
      .where("sessionId", "==", sessionId)
      .get();
    if (userScoresDoc.empty) {
      return {};
    }
    return userScoresDoc.docs.reduce((agg, userScoreDoc) => {
      const scoreData = userScoreDoc.data();
      agg[scoreData.sectionId] = {
        ...agg[scoreData.sectionId],
        [scoreData.userId]: scoreData.score,
      };
      return agg;
    }, {} as SessionScores);
  }

  static async writeBulkUserScoreForSession(
    sessionId: string,
    sectionUserScores: Map<string, Map<string, number>>
  ) {
    const scoreDocs: DocumentReference<
      SessionSectionUserScore,
      FirebaseFirestore.DocumentData
    >[] = [];

    const batch = db.batch();

    Array.from(sectionUserScores.entries()).forEach(
      ([sectionId, userScores]) => {
        Array.from(userScores.entries()).forEach(([userId, score]) => {
          const doc = this.userScoresCollection.doc();
          batch.create(doc, {
            id: doc.id,
            sessionId,
            score,
            sectionId,
            userId,
          });
          scoreDocs.push(doc);
        });
      }
    );

    await batch.commit();
  }

  static async writeUserScoreForSession(
    userScore: Omit<SessionSectionUserScore, "id">
  ) {
    const userScoreQuery = await UserScoreService.userScoresCollection
      .where("sessionId", "==", userScore.sessionId)
      .where("sectionId", "==", userScore.sectionId)
      .where("userId", "==", userScore.userId)
      .get();

    if (userScoreQuery.empty) {
      const doc = this.userScoresCollection.doc();
      const scoreData = { ...userScore, id: doc.id };
      await doc.set(scoreData);
      return scoreData;
    }

    const userScoreData = userScoreQuery.docs[0].data();
    userScoreData.score = userScore.score;
    await this.userScoresCollection.doc(userScoreData.id).set(userScoreData);
    return userScoreData;
  }

  static async archiveUserScores(batchSize: number = 500): Promise<void> {
    await archiveCollectionData("userScores", batchSize);
  }
}
