import * as admin from 'firebase-admin';
import path from 'path';

// Check specifically for the DEFAULT app — admin.apps includes ALL named apps
const defaultAppExists = admin.apps.some(a => a?.name === '[DEFAULT]');

if (!defaultAppExists) {
  let creds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (creds && !path.isAbsolute(creds)) {
    creds = path.join(process.cwd(), creds);
  }
  admin.initializeApp({
    credential: creds ? admin.credential.cert(creds) : admin.credential.applicationDefault(),
  });
  console.log('[Firebase] default app initialized (horus-98edf — FCM)');
}

export const messaging = admin.app().messaging();
