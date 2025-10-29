// Endpoint de login para Vercel Serverless Functions
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  let pool = null;
  let conn = null;

  try {
    // Verificar variables de entorno
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      console.error('❌ Variables de entorno faltantes');
      return res.status(500).json({ 
        ok: false, 
        error: 'Configuración de base de datos incompleta' 
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Usuario y contraseña requeridos' 
      });
    }

    console.log('🔍 Intentando login para:', username);

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
      
      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!validPassword) {
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