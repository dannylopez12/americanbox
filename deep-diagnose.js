require('dotenv').config({ path: '.env.migration' });
const fs = require('fs');
const path = require('path');

// ✅ API modular
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

(async () => {
  console.log('🔍 Diagnóstico profundo de Firestore...\n');

  try {
    const credPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_CREDENTIALS_PATH;

    if (!credPath) throw new Error('No se definió GOOGLE_APPLICATION_CREDENTIALS o FIREBASE_CREDENTIALS_PATH');

    const absPath = path.resolve(credPath);
    if (!fs.existsSync(absPath)) throw new Error(`No se encuentra el JSON de credenciales en: ${absPath}`);

    const serviceAccount = JSON.parse(fs.readFileSync(absPath, 'utf8'));

    console.log('📋 Credenciales:');
    console.log(`   Project ID (env): ${process.env.FIREBASE_PROJECT_ID || '(no set)'}`);
    console.log(`   Project ID (json): ${serviceAccount.project_id}`);
    console.log(`   Client Email: ${serviceAccount.client_email}\n`);

    console.log('🚀 Inicializando Firebase...');
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
    console.log('✅ Firebase inicializado\n');

    // Auth (API modular)
    try {
      await getAuth(app).listUsers(1);
      console.log('🔑 Auth: ✅ accesible');
    } catch (e) {
      console.log(`🔑 Auth: ❌ ${e.message}`);
    }

    // --- Firestore ---
    // Si quieres usar tu base personalizada, pon aquí su ID:
    //   'americanbox'  o  'americanboxx'
    const DATABASE_ID = 'americanbox';   // <-- cámbialo si usarás la otra
    // Si más adelante creas (default), usa getFirestore(app) sin 2º parámetro.

    const db = getFirestore(app, DATABASE_ID); // ✅ correcto en admin >=11
    console.log('\n🔥 Firestore: listando colecciones...');

    const cols = await db.listCollections();
    console.log(`✅ Firestore accesible — ${cols.length} colecciones`);
    if (cols.length) cols.forEach(c => console.log('   -', c.id));

    const pingRef = db.collection('_diagnostic').doc('ping');
    await pingRef.set({ ok: true, at: new Date().toISOString() });
    const snap = await pingRef.get();
    console.log(`📝 Write/Read: ✅ ${JSON.stringify(snap.data())}`);

    console.log('\n🎉 Todo OK. Firestore está habilitado y con permisos.');
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
  } finally {
    process.exit(0);
  }
})();
