require('dotenv').config({ path: '.env.migration' });
const admin = require('firebase-admin');

async function testFirestoreAccess() {
  console.log('🔍 Probando acceso específico a Firestore...\n');

  try {
    // Inicializar con configuración básica
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

    console.log('🚀 Inicializando Firebase...');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log('✅ Firebase inicializado');

    // Probar diferentes operaciones
    const db = admin.firestore();

    console.log('\n🔍 Probando operaciones básicas...');

    // 1. Intentar listar colecciones
    try {
      console.log('📋 Listando colecciones...');
      const collections = await db.listCollections();
      console.log(`✅ Colecciones encontradas: ${collections.length}`);
      collections.forEach(col => console.log(`   - ${col.id}`));
    } catch (error) {
      console.log(`❌ Error listando colecciones: ${error.code} - ${error.message}`);
    }

    // 2. Intentar acceder a una colección específica
    try {
      console.log('\n📝 Intentando acceder a colección "test"...');
      const testRef = db.collection('test');
      const snapshot = await testRef.limit(1).get();
      console.log(`✅ Colección 'test' accesible - Documentos: ${snapshot.size}`);
    } catch (error) {
      console.log(`❌ Error accediendo colección 'test': ${error.code} - ${error.message}`);
    }

    // 3. Intentar crear un documento
    try {
      console.log('\n📝 Intentando crear documento de prueba...');
      const docRef = db.collection('diagnostics').doc(`test-${Date.now()}`);
      await docRef.set({
        message: 'Test document',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'migration-test'
      });
      console.log('✅ Documento creado exitosamente');

      // Limpiar
      await docRef.delete();
      console.log('🧹 Documento de prueba eliminado');
    } catch (error) {
      console.log(`❌ Error creando documento: ${error.code} - ${error.message}`);
    }

    // 4. Verificar configuración del proyecto
    console.log('\n📊 Información del proyecto:');
    console.log(`   Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log(`   Database URL: https://console.firebase.google.com/project/${process.env.FIREBASE_PROJECT_ID}/firestore`);

  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

testFirestoreAccess();