// Endpoint /api/auth/me para verificar sesión con Firebase
const { auth, db } = require('./firebase');

console.log('🔧 Auth ME function loaded');

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

  // Obtener token de Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No token provided');
    return res.status(401).json({
      ok: false,
      logged: false,
      error: 'Token requerido'
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log('✅ Token verified for user:', decodedToken.uid);

    // Buscar info adicional en Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    let userData = {};
    if (userDoc.exists) {
      userData = userDoc.data();
    }

    return res.status(200).json({
      ok: true,
      logged: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      username: decodedToken.email, // O userData.username si existe
      role: userData.role || 'user',
      customer_id: userData.customer_id || null,
      ...userData
    });
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return res.status(401).json({
      ok: false,
      logged: false,
      error: 'Token inválido'
    });
  }
}