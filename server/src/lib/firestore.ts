import * as admin from 'firebase-admin';
import path from 'path';

// Named app that points to horus-64e3b (the project where Firestore exists)
const FIRESTORE_APP = 'horus-firestore';

function getFirestoreApp(): admin.app.App {
  const existing = admin.apps.find(a => a?.name === FIRESTORE_APP);
  if (existing) return existing;
  const credPath = path.join(process.cwd(), 'firebase-horus-main.json');
  return admin.initializeApp(
    { credential: admin.credential.cert(credPath) },
    FIRESTORE_APP,
  );
}

export const db = getFirestoreApp().firestore();
