// Función de diagnóstico completo para Vercel
const { db } = require('./firebase');

module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? '✓ Configurado' : '❌ Faltante',
      },
      database: null,
      error: null
    };

    // Intentar conexión a Firestore
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const collections = await db.listCollections();
        diagnostics.database = {
          status: '✓ Conectado',
          collections: collections.map(col => col.id),
          testQuery: 'successful'
        };

        // Verificar colección users
        const usersSnapshot = await db.collection('users').limit(1).get();
        diagnostics.database.usersCollection = usersSnapshot.size > 0 ? '✓ Tiene documentos' : '⚠ Vacía';

      } else {
        diagnostics.database = {
          status: '❌ Variables de entorno faltantes',
          missing: ['FIREBASE_SERVICE_ACCOUNT_KEY']
        };
      }
    } catch (dbError) {
      diagnostics.database = {
        status: '❌ Error de conexión',
        error: dbError.message
      };
    }

    return res.status(200).json(diagnostics);
    
  } catch (error) {
    return res.status(500).json({
      error: 'Error en diagnóstico',
      message: error.message,
      stack: error.stack
    });
  }
}