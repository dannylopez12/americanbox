require('dotenv').config({ path: '.env.migration' });
const admin = require('firebase-admin');

async function diagnoseFirebase() {
  console.log('🔍 Diagnóstico detallado de Firebase...\n');

  try {
    // Verificar variables de entorno
    console.log('📋 Variables de entorno:');
    console.log('   Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('   Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
    console.log('   Private Key length:', process.env.FIREBASE_PRIVATE_KEY?.length);
    console.log('   Private Key ID:', process.env.FIREBASE_PRIVATE_KEY_ID);
    console.log('');

    // Verificar que Firebase no esté ya inicializado
    console.log('🔧 Estado de Firebase:');
    console.log('   Apps inicializadas:', admin.apps.length);
    console.log('');

    // Inicializar Firebase
    console.log('🚀 Inicializando Firebase...');
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

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase inicializado correctamente');
    } else {
      console.log('ℹ️  Firebase ya estaba inicializado');
    }

    // Probar Firestore
    console.log('\n🔥 Probando Firestore...');
    const db = admin.firestore();

    // Intentar crear una colección de prueba
    console.log('📝 Creando documento de prueba...');
    const testRef = db.collection('diagnostics').doc('test-connection');
    await testRef.set({
      message: 'Firebase connection test',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      success: true
    });
    console.log('✅ Documento de prueba creado');

    // Leer el documento
    console.log('📖 Leyendo documento de prueba...');
    const doc = await testRef.get();
    if (doc.exists) {
      console.log('✅ Documento leído correctamente:', doc.data());
    } else {
      console.log('❌ Documento no encontrado');
    }

    // Limpiar
    await testRef.delete();
    console.log('🧹 Documento de prueba eliminado');

    console.log('\n🎉 ¡Diagnóstico completado exitosamente!');
    console.log('🔗 Firebase y Firestore están funcionando correctamente');

  } catch (error) {
    console.log('\n❌ Error en el diagnóstico:');
    console.log('   Código:', error.code);
    console.log('   Mensaje:', error.message);

    if (error.code === 5) {
      console.log('\n💡 Posibles soluciones para NOT_FOUND:');
      console.log('   1. Espera 5-10 minutos más para que Firestore se propague');
      console.log('   2. Verifica que Firestore esté habilitado en Firebase Console');
      console.log('   3. Asegúrate de que el service account tenga permisos de Firestore');
      console.log('   4. Verifica que el proyecto ID sea correcto');
    }

    if (error.code === 7) {
      console.log('\n💡 Posibles soluciones para PERMISSION_DENIED:');
      console.log('   1. Ve a IAM & Admin → IAM en Google Cloud Console');
      console.log('   2. Agrega el rol "Cloud Datastore User" al service account');
      console.log('   3. O usa "Editor" para permisos completos');
    }
  }
}

diagnoseFirebase();