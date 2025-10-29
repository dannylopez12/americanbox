// Script para probar conexión a Firebase en Vercel
const { db } = require('./lib/firebase');

module.exports = async function handler(req, res) {
  console.log('🧪 Testing Firebase connection...');

  try {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    console.log('🧪 Firebase config:', {
      projectId: process.env.FIREBASE_PROJECT_ID,
      hasCredentials: !!(process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL)
    });

    // Probar conexión y contar documentos
    const collections = ['users', 'customers', 'orders', 'providers', 'addresses'];
    const stats = {};

    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).get();
        stats[collectionName] = snapshot.size;
        console.log(`✅ ${collectionName}: ${snapshot.size} documentos`);
      } catch (error) {
        stats[collectionName] = `Error: ${error.message}`;
        console.error(`❌ Error counting ${collectionName}:`, error.message);
      }
    }

    return res.status(200).json({
      ok: true,
      message: 'Firebase connection successful',
      stats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Firebase test error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Firebase connection failed',
      details: error.message
    });
  }
};