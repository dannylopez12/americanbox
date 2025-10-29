const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkAdmin() {
  try {
    const conn = await pool.getConnection();
    const [users] = await conn.query('SELECT id, username, role, is_admin FROM users WHERE role = ? OR is_admin = ?', ['admin', 1]);
    console.log('✅ Usuarios admin encontrados:', users);
    conn.release();
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    process.exit(0);
  }
}

checkAdmin();