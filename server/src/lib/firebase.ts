import * as admin from 'firebase-admin';
import path from 'path';

if (!admin.apps.length) {
  try {
    // Si la variable no es una ruta absoluta, intentamos resolverla relativa a la raíz del servidor
    let creds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (creds && !path.isAbsolute(creds)) {
      creds = path.join(process.cwd(), creds);
    }

    admin.initializeApp({
      credential: creds ? admin.credential.cert(creds) : admin.credential.applicationDefault(),
    });
    console.log('Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('Error inicializando Firebase Admin:', error);
  }
}

export const messaging = admin.messaging();
