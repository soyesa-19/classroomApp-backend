import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../secrets/serviceAccountKey.json' with { type: 'json' };

initializeApp({
  credential: cert(serviceAccount as ServiceAccount)
});

export const db = getFirestore();

if (process.env.FIRESTORE_EMULATOR_HOST) {
  db.settings({ host: process.env.FIRESTORE_EMULATOR_HOST, ssl: false });
}

/**
 * Utility to move data from a collection to its archive collection in bulk.
 * The archive collection follows the pattern `archive_{collectionName}`.
 *
 * @param {string} collectionName - The name of the collection to archive.
 * @param {number} batchSize - The size of each batch operation.
 */
export async function archiveCollectionData(
  collectionName: string,
  batchSize: number = 500
): Promise<void> {
  const collectionRef = db.collection(collectionName);
  const archiveCollectionRef = db.collection(`archive_${collectionName}`);

  let lastDoc = null;

  while (true) {
    let query = collectionRef.orderBy("id").limit(batchSize);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log(`No more documents to archive in ${collectionName}.`);
      break;
    }

    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const archiveDocRef = archiveCollectionRef.doc(doc.id);

      // Add to archive collection
      batch.set(archiveDocRef, data);

      // Delete from original collection
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Archived ${snapshot.size} documents from ${collectionName}.`);

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  console.log(`Archiving completed for collection: ${collectionName}`);
}
