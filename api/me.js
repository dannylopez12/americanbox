// Endpoint /api/auth/me para verificar sesión con Firebase
const { db } = require('./lib/firebase');

console.log('🔧 Auth ME function loaded with Firebase');

module.exports = async function handler(req, res) {
  console.log('🔍 Auth ME request received:', req.method, req.url);

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    // En Vercel serverless, no tenemos sesiones como en Express
    // Por ahora, devolveremos que no hay sesión activa
    // Esto significa que los usuarios tendrán que hacer login cada vez
    // TODO: Implementar JWT tokens o similar para mantener la sesión

    console.log('ℹ️ No session management in Vercel serverless - returning not logged in');

    return res.status(200).json({
      ok: true,
      logged: false,
      role: null,
      uid: null,
      user: null
    });

  } catch (error) {
    console.error('❌ Auth ME error:', error);

    // Verificar si es un error de configuración de Firebase
    if (error.message && error.message.includes('Firebase')) {
      return res.status(500).json({
        ok: false,
        error: 'Configuración de base de datos incompleta - verifica variables de entorno en Vercel'
      });
    }

    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor'
    });
  }
}