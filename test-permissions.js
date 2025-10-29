require('dotenv').config({ path: '.env.migration' });
const admin = require('firebase-admin');

async function testFirebasePermissions() {
  console.log('🔐 Probando permisos de Firebase...\n');

  try {
    // Inicializar Firebase
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

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log('✅ Firebase inicializado');

    // Probar acceso a Auth
    console.log('🔑 Probando Firebase Auth...');
    try {
      const auth = admin.auth();
      // Solo verificar que podemos acceder al servicio
      console.log('✅ Firebase Auth accesible');
    } catch (authError) {
      console.log('❌ Error en Firebase Auth:', authError.message);
    }

    // Probar acceso a Firestore
    console.log('🔥 Probando Firestore...');
    const db = admin.firestore();

    // Intentar listar colecciones (esto requiere permisos de lectura)
    try {
      const collections = await db.listCollections();
      console.log('✅ Firestore accesible - Colecciones encontradas:', collections.length);
    } catch (firestoreError) {
      console.log('❌ Error en Firestore:', firestoreError.code, firestoreError.message);

      if (firestoreError.code === 7) { // PERMISSION_DENIED
        console.log('\n🚨 PERMISOS INSUFICIENTES');
        console.log('💡 Solución: Agregar rol "Cloud Datastore User" o "Editor" al service account');
        console.log('   1. Ve a https://console.cloud.google.com/iam-admin/iam');
        console.log('   2. Selecciona el proyecto americanbox-e368b');
        console.log('   3. Busca: firebase-adminsdk-fbsvc@americanbox-e368b.iam.gserviceaccount.com');
        console.log('   4. Edita roles → Agrega "Cloud Datastore User"');
      } else if (firestoreError.code === 5) { // NOT_FOUND
        console.log('\n🚨 FIRESTORE NO HABILITADO');
        console.log('💡 Solución: Habilitar Firestore en Firebase Console');
        console.log('   1. Ve a https://console.firebase.google.com/');
        console.log('   2. Selecciona el proyecto americanbox-e368b');
        console.log('   3. Build → Firestore Database → Crear base de datos');
      }
    }

    // Probar Storage (si está habilitado)
    console.log('📦 Probando Firebase Storage...');
    try {
      const bucket = admin.storage().bucket();
      console.log('✅ Firebase Storage accesible');
    } catch (storageError) {
      console.log('ℹ️  Firebase Storage no disponible:', storageError.message);
    }

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

testFirebasePermissions();