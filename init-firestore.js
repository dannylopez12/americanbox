require('dotenv').config({ path: '.env.migration' });
const admin = require('firebase-admin');

async function initializeFirestore() {
  console.log('🚀 Inicializando Firestore con colección de prueba...\n');

  try {
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

    const db = admin.firestore();

    // Crear colección de inicialización
    console.log('📝 Creando colección de inicialización...');
    const initRef = db.collection('system').doc('initialization');

    await initRef.set({
      initialized: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      version: '1.0.0',
      description: 'Firestore database initialized for American Box migration'
    });

    console.log('✅ Colección de inicialización creada');

    // Verificar que se puede leer
    const doc = await initRef.get();
    if (doc.exists) {
      console.log('✅ Documento leído correctamente:', doc.data());
    }

    // Crear algunas colecciones básicas que usaremos en la migración
    console.log('\n📋 Creando colecciones básicas...');

    const collections = ['users', 'customers', 'orders', 'providers', 'addresses', 'company_settings'];

    for (const collectionName of collections) {
      const testDocRef = db.collection(collectionName).doc('test-initialization');
      await testDocRef.set({
        initialized: true,
        collection: collectionName,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Colección '${collectionName}' inicializada`);

      // Limpiar documento de prueba
      await testDocRef.delete();
    }

    console.log('\n🎉 ¡Firestore inicializado exitosamente!');
    console.log('🔥 Todas las colecciones básicas están listas para la migración');

    // Verificar que podemos listar colecciones
    const allCollections = await db.listCollections();
    console.log(`\n📊 Colecciones disponibles: ${allCollections.length}`);
    allCollections.forEach(col => console.log(`   - ${col.id}`));

  } catch (error) {
    console.log(`❌ Error inicializando Firestore: ${error.code} - ${error.message}`);

    if (error.code === 7) {
      console.log('\n🚨 PERMISOS INSUFICIENTES');
      console.log('Ve a https://console.cloud.google.com/iam-admin/iam');
      console.log('Agrega rol "Cloud Datastore User" al service account');
    }
  }
}

initializeFirestore();