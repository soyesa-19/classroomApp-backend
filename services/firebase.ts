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
