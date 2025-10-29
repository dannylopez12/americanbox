// /api/login.js
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Cachear el pool de conexión (Vercel crea una nueva instancia por request si no se cachea)
let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      console.error('❌ Configuración de base de datos incompleta:', {
        DB_HOST: process.env.DB_HOST ? 'SET' : 'NOT SET',
        DB_USER: process.env.DB_USER ? 'SET' : 'NOT SET',
        DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT SET',
        DB_NAME: process.env.DB_NAME ? 'SET' : 'NOT SET'
      });
      throw new Error('Configuración de base de datos incompleta - Verifica tus variables de entorno en Vercel');
    }

    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 5,
      charset: 'utf8mb4_unicode_ci',
      connectTimeout: 10000,
      acquireTimeout: 30000,
      ssl: false
    });

    console.log('✅ Pool MySQL inicializado');
  }
  return pool;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  let conn;
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'Usuario y contraseña requeridos' });
    }

    const pool = getPool();
    conn = await pool.getConnection();

    const [rows] = await conn.execute(
      'SELECT id, username, password_hash, is_admin, role FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }

    const isAdmin = Boolean(user.is_admin) || user.role === 'admin';
    const redirect = isAdmin ? '/dashboard' : '/client';

    return res.status(200).json({
      ok: true,
      redirect,
      user: {
        id: user.id,
        username: user.username,
        isAdmin,
        role: user.role
      }
    });
  } catch (err) {
    console.error('❌ Error en /api/login:', err.message);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    if (conn) conn.release();
  }
}
