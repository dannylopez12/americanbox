// Endpoint /api/auth/me para verificar sesión
const mysql = require('mysql2/promise');

console.log('🔧 Auth ME function loaded');

// Pool de conexión MySQL
function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
    charset: 'utf8mb4_unicode_ci',
    acquireTimeout: 30000,
    timeout: 30000,
    ssl: false
  });
}

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
    customer_id: null,
    username: null
  });
}