import * as admin from 'firebase-admin';
import path from 'path';

const defaultAppExists = admin.apps.some(a => a?.name === '[DEFAULT]');

if (!defaultAppExists) {
  let credential: admin.credential.Credential;

  if (process.env.FIREBASE_FCM_JSON) {
    credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_FCM_JSON));
  } else {
    let creds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (creds && !path.isAbsolute(creds)) creds = path.join(process.cwd(), creds);
    credential = creds ? admin.credential.cert(creds) : admin.credential.applicationDefault();
  }

  admin.initializeApp({ credential });
}

export const messaging = admin.app().messaging();
