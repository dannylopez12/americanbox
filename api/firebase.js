// api/firebase.js
const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK solo si no está inicializado
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`, // Opcional, si usas Realtime DB
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };