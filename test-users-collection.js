// Script de prueba para verificar escritura en colección users
const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

(async () => {
  console.log('🧪 Probando escritura en diferentes colecciones...\n');

  try {
    const serviceAccountPath = 'americanbox-e368b-firebase-adminsdk-fbsvc-763442ab42.json';
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    const db = getFirestore(app);

    // Probar escritura en colección _diagnostic (que sabemos que funciona)
    console.log('📝 Probando escritura en _diagnostic...');
    await db.collection('_diagnostic').doc('test-users').set({
      test: 'users collection test',
      timestamp: new Date().toISOString()
    });
    console.log('✅ _diagnostic funciona');

    // Probar escritura en colección test_users
    console.log('📝 Probando escritura en test_users...');
    await db.collection('test_users').doc('test-doc').set({
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    });
    console.log('✅ test_users funciona');

    // Ahora probar users
    console.log('📝 Probando escritura en users...');
    await db.collection('users').doc('test-user').set({
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    });
    console.log('✅ users funciona');

  } catch (err) {
    console.error(`❌ Error en colección users: ${err.message}`);
  } finally {
    process.exit(0);
  }
})();