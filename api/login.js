// Endpoint de login para Vercel Serverless Functions
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const session = require('express-session');

// Pool de conexión MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  charset: 'utf8mb4_unicode_ci',
  acquireTimeout: 60000,
  timeout: 60000,
});

export default async function handler(req, res) {
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

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Usuario y contraseña requeridos' 
      });
    }

    const conn = await pool.getConnection();
    
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

      // Login exitoso
      return res.status(200).json({
        ok: true,
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.is_admin,
          role: user.role
        }
      });

    } finally {
      conn.release();
    }

  } catch (error) {
    console.error('❌ Error en login:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
}