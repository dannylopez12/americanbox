require('dotenv').config({ path: '.env.migration' });
const admin = require('firebase-admin');

async function testFirestoreWithRegion() {
  console.log('🌍 Probando Firestore con diferentes configuraciones...\n');

  const regions = ['us-central1', 'us-east1', 'europe-west1', 'asia-southeast1'];

  for (const region of regions) {
    console.log(`\n🔍 Probando región: ${region}`);

    try {
      // Limpiar apps anteriores
      if (admin.apps.length > 0) {
        await admin.app().delete();
      }

      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      // Inicializar con región específica
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
        databaseURL: `https://${region}-firestore.googleapis.com`
      });

      console.log(`✅ Firebase inicializado en ${region}`);

      const db = admin.firestore();

      // Intentar crear documento
      const testRef = db.collection('diagnostics').doc(`region-test-${region}-${Date.now()}`);
      await testRef.set({
        region: region,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        test: true
      });

      console.log(`🎉 ¡ÉXITO! Firestore funciona en región ${region}`);

      // Limpiar
      await testRef.delete();
      console.log(`🧹 Documento de prueba eliminado`);

      // Si encontramos una región que funciona, paramos
      break;

    } catch (error) {
      console.log(`❌ Error en ${region}: ${error.code} - ${error.message}`);
    }
  }

  console.log('\n💡 Si ninguna región funcionó, verifica:');
  console.log('   1. Que Firestore esté realmente habilitado');
  console.log('   2. Que el service account tenga permisos');
  console.log('   3. Que el proyecto ID sea correcto');
}

testFirestoreWithRegion();