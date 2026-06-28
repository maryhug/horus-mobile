import * as admin from 'firebase-admin';
import path from 'path';

const FIRESTORE_APP = 'horus-firestore';

function getFirestoreApp(): admin.app.App {
  const existing = admin.apps.find(a => a?.name === FIRESTORE_APP);
  if (existing) return existing;

  let credential: admin.credential.Credential;
  if (process.env.FIREBASE_FIRESTORE_JSON) {
    credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_FIRESTORE_JSON));
  } else {
    const credPath = path.join(process.cwd(), 'firebase-horus-main.json');
    credential = admin.credential.cert(credPath);
  }

  return admin.initializeApp({ credential }, FIRESTORE_APP);
}

export const db = getFirestoreApp().firestore();
