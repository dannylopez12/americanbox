require('dotenv').config({ path: '.env.migration' });
const { db } = require('./api/lib/firebase');

async function testFirebaseConnection() {
  console.log('🧪 Probando conexión a Firebase...');

  try {
    // Intentar hacer una consulta simple
    const testCollection = db.collection('test');
    const snapshot = await testCollection.limit(1).get();

    console.log('✅ Conexión a Firebase exitosa!');
    console.log('📊 Proyecto:', process.env.FIREBASE_PROJECT_ID);
    console.log('🔥 Firestore está funcionando correctamente');

    // Crear un documento de prueba
    const testDoc = await testCollection.add({
      message: 'Test connection successful',
      timestamp: new Date(),
      migrated: false
    });

    console.log('✅ Documento de prueba creado:', testDoc.id);

    // Limpiar el documento de prueba
    await testDoc.delete();
    console.log('🧹 Documento de prueba eliminado');

    return true;

  } catch (error) {
    console.error('❌ Error conectando a Firebase:', error.message);
    console.error('🔍 Revisa que las variables de entorno estén configuradas correctamente');
    console.error('📝 Asegúrate de que el service account tenga permisos para Firestore');
    return false;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testFirebaseConnection().then(success => {
    if (success) {
      console.log('\n🎉 ¡Firebase está listo para la migración!');
      console.log('🚀 Ahora puedes ejecutar: npm run migrate');
    } else {
      console.log('\n❌ Configura Firebase correctamente antes de migrar');
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testFirebaseConnection };