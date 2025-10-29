// Test endpoint para verificar que las serverless functions funcionan
module.exports = async function handler(req, res) {
  console.log('🧪 Test endpoint called');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    ok: true,
    message: 'AmericanBox API funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      host: process.env.DB_HOST ? 'configured' : 'not configured',
      database: process.env.DB_NAME ? 'configured' : 'not configured'
    }
  });
}