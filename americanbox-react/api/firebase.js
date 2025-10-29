// /api/firebase.js
import admin from 'firebase-admin';

// Inicializar Firebase Admin SDK solo si no está inicializado
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('✅ Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error);
    throw error;
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
