// Función de diagnóstico completo para Vercel
const mysql = require('mysql2/promise');

export default async function handler(req, res) {
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
        DB_HOST: process.env.DB_HOST ? '✓ Configurado' : '❌ Faltante',
        DB_USER: process.env.DB_USER ? '✓ Configurado' : '❌ Faltante',
        DB_PASSWORD: process.env.DB_PASSWORD ? '✓ Configurado' : '❌ Faltante',
        DB_NAME: process.env.DB_NAME ? '✓ Configurado' : '❌ Faltante',
      },
      database: null,
      error: null
    };

    // Intentar conexión a base de datos
    try {
      if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
        const pool = mysql.createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          connectionLimit: 1,
          charset: 'utf8mb4_unicode_ci',
          acquireTimeout: 10000,
          timeout: 10000,
        });

        const conn = await pool.getConnection();
        
        try {
          // Test query simple
          const [result] = await conn.execute('SELECT 1 as test');
          diagnostics.database = {
            status: '✓ Conectado',
            testQuery: result
          };
          
          // Verificar tabla users
          const [tables] = await conn.execute("SHOW TABLES LIKE 'users'");
          diagnostics.database.usersTable = tables.length > 0 ? '✓ Existe' : '❌ No existe';
          
          if (tables.length > 0) {
            const [userCount] = await conn.execute('SELECT COUNT(*) as count FROM users');
            diagnostics.database.userCount = userCount[0].count;
          }
          
        } finally {
          conn.release();
          await pool.end();
        }
      } else {
        diagnostics.database = {
          status: '❌ Variables de entorno faltantes',
          missing: []
        };
        
        if (!process.env.DB_HOST) diagnostics.database.missing.push('DB_HOST');
        if (!process.env.DB_USER) diagnostics.database.missing.push('DB_USER');
        if (!process.env.DB_PASSWORD) diagnostics.database.missing.push('DB_PASSWORD');
        if (!process.env.DB_NAME) diagnostics.database.missing.push('DB_NAME');
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