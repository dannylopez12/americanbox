// Copia exacta del deep-diagnose.js pero solo para probar escritura
const fs = require('fs');
const path = require('path');

// ✅ API modular
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

(async () => {
  console.log('🔍 Probando solo escritura...\n');

  try {
    const credPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_CREDENTIALS_PATH;

    if (!credPath) throw new Error('No se definió GOOGLE_APPLICATION_CREDENTIALS o FIREBASE_CREDENTIALS_PATH');

    const absPath = path.resolve(credPath);
    if (!fs.existsSync(absPath)) throw new Error(`No se encuentra el JSON de credenciales en: ${absPath}`);

    const serviceAccount = JSON.parse(fs.readFileSync(absPath, 'utf8'));

    console.log('🚀 Inicializando Firebase...');
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
    console.log('✅ Firebase inicializado\n');

    const db = getFirestore(app);

    console.log('📝 Probando escritura en _diagnostic...');
    const pingRef = db.collection('_diagnostic').doc('ping-write-test');
    await pingRef.set({ ok: true, at: new Date().toISOString() });
    const snap = await pingRef.get();
    console.log(`📝 Write/Read: ✅ ${JSON.stringify(snap.data())}`);

    console.log('\n🎉 Escritura funciona correctamente.');
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
  } finally {
    process.exit(0);
  }
})();