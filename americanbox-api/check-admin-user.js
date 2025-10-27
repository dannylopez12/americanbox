const mysql = require('mysql2/promise');

async function checkAdminUser() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'americanbox'
  });

  try {
    const conn = await pool.getConnection();
    
    console.log('🔍 Verificando usuarios admin...');
    const [admins] = await conn.query("SELECT id, username, is_admin, role FROM users WHERE is_admin = 1 OR role = 'admin'");
    
    if (admins.length > 0) {
      console.log('✅ Usuarios admin encontrados:');
      admins.forEach(admin => {
        console.log(`   - ID: ${admin.id}, Username: ${admin.username}, Role: ${admin.role}`);
      });
    } else {
      console.log('❌ No hay usuarios admin');
      
      // Vamos a verificar todos los usuarios
      console.log('\n📋 Todos los usuarios:');
      const [allUsers] = await conn.query("SELECT id, username, is_admin, role FROM users LIMIT 5");
      allUsers.forEach(user => {
        console.log(`   - ID: ${user.id}, Username: ${user.username}, Admin: ${user.is_admin}, Role: ${user.role}`);
      });
    }
    
    conn.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdminUser();