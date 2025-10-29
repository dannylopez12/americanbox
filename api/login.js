// Endpoint de login para Vercel Serverless Functions con Firebase
const bcrypt = require('bcryptjs');
const { db } = require('./lib/firebase');

console.log('🔧 Login function loaded with Firebase');
console.log('Environment variables check:', {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET'
});

// Función auxiliar para verificar sesión (simplificada para Vercel)
async function checkSession() {
  // En Vercel serverless, no tenemos sesiones persistentes como en Express
  // Por ahora, devolveremos que no hay sesión (esto es temporal)
  // TODO: Implementar un sistema de tokens JWT o similar
  return { logged: false, role: null, uid: null };
}

module.exports = async function handler(req, res) {
  console.log('🔐 Login request received:', req.method, req.url);

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({
        ok: false,
        error: 'Usuario y contraseña son requeridos'
      });
    }

    console.log('🔍 Searching for user:', username);

    // Buscar usuario en Firestore
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('username', '==', username).limit(1).get();

    if (userQuery.empty) {
      console.log('❌ User not found:', username);
      return res.status(401).json({
        ok: false,
        error: 'Usuario o contraseña incorrectos'
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    console.log('👤 User found:', userData.username);

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);

    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', username);
      return res.status(401).json({
        ok: false,
        error: 'Usuario o contraseña incorrectos'
      });
    }

    console.log('✅ Login successful for user:', username);

    // Crear respuesta de login exitoso
    const userResponse = {
      id: userData.id,
      username: userData.username,
      role: userData.role,
      is_admin: userData.is_admin,
      customer_id: userData.customer_id
    };

    // En Vercel serverless, no podemos mantener sesiones tradicionales
    // TODO: Implementar JWT tokens para mantener la sesión

    return res.status(200).json({
      ok: true,
      message: 'Login exitoso',
      user: userResponse,
      logged: true
    });

  } catch (error) {
    console.error('❌ Login error:', error);

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
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  let pool = null;
  let conn = null;

  try {
    // Verificar variables de entorno
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      console.error('❌ Variables de entorno faltantes:', {
        DB_HOST: !!process.env.DB_HOST,
        DB_USER: !!process.env.DB_USER,
        DB_PASSWORD: !!process.env.DB_PASSWORD,
        DB_NAME: !!process.env.DB_NAME
      });
      return res.status(500).json({ 
        ok: false, 
        error: 'Configuración de base de datos incompleta - verifica variables de entorno en Vercel' 
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ 
        ok: false, 
        error: 'Usuario y contraseña requeridos' 
      });
    }

    console.log('🔍 Attempting login for:', username);

    pool = createPool();
    conn = await pool.getConnection();
    
    try {
      // Buscar usuario
      const [users] = await conn.execute(
        'SELECT id, username, password_hash, is_admin, role FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        return res.status(401).json({ 
          ok: false, 
          error: 'Credenciales inválidas' 
        });
      }

      const user = users[0];
      console.log('👤 User found:', { id: user.id, username: user.username, is_admin: user.is_admin, role: user.role });
      
      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password_hash);
      console.log('🔐 Password validation result:', validPassword);
      
      if (!validPassword) {
        console.log('❌ Invalid password for user:', username);
        return res.status(401).json({ 
          ok: false, 
          error: 'Credenciales inválidas' 
        });
      }

      // Login exitoso - determinar redirect basado en rol
      const isAdmin = Boolean(user.is_admin) || user.role === 'admin';
      const redirect = isAdmin ? '/dashboard' : '/client';
      
      return res.status(200).json({
        ok: true,
        redirect: redirect,
        user: {
          id: user.id,
          username: user.username,
          isAdmin: Boolean(user.is_admin),
          role: user.role
        }
      });

    } finally {
      if (conn) conn.release();
      if (pool) await pool.end();
    }

  } catch (error) {
    console.error('❌ Error en login:', error);
    console.error('Stack trace:', error.stack);
    
    // Limpiar conexiones en caso de error
    try {
      if (conn) conn.release();
      if (pool) await pool.end();
    } catch (cleanupError) {
      console.error('Error en cleanup:', cleanupError);
    }
    
    return res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}