const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function resetAdminPassword() {
  try {
    const conn = await pool.getConnection();
    
    // Generar nuevo hash para la contraseña "admin123"
    const newPassword = 'admin123';
    const hash = await bcrypt.hash(newPassword, 10);
    
    // Actualizar la contraseña del admin
    await conn.query('UPDATE users SET password_hash = ? WHERE username = ?', [hash, 'admin']);
    
    console.log('✅ Contraseña del admin actualizada a "admin123"');
    
    conn.release();
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    process.exit(0);
  }
}

resetAdminPassword();