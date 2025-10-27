const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME,
  connectionLimit: 10,
  charset: 'utf8mb4_unicode_ci',
});

async function checkTableStructure() {
  try {
    const conn = await pool.getConnection();
    
    const [result] = await conn.query('DESCRIBE complaints');
    console.log('📋 Estructura real de la tabla complaints:');
    result.forEach(field => {
      console.log(`${field.Field}: ${field.Type} ${field.Null === 'YES' ? '(nullable)' : '(required)'} ${field.Key || ''} ${field.Default !== null ? `default: ${field.Default}` : ''}`);
    });
    
    conn.release();
  } catch(e) {
    console.error('❌ Error:', e.message);
  }
  
  process.exit(0);
}

checkTableStructure();