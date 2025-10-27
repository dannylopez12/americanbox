const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateClientPassword() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME,
      charset: 'utf8mb4_unicode_ci',
    });

    console.log('🔑 Actualizando contraseña de usuario cliente para pruebas...\n');
    
    // Hash para la contraseña 'password'
    const passwordHash = '$2b$10$x/9ohgbdzgnq2NjVirAfgO9qPfb6xv4WS/jYZGvje3Ur9kKy.JY3i';
    
    // Actualizar usuario cliente para pruebas
    const [result] = await connection.execute(
      'UPDATE users SET password_hash = ? WHERE username = ? AND role = ?', 
      [passwordHash, 'Dannyadmin1', 'customer']
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Contraseña actualizada para usuario Dannyadmin1');
      console.log('   Username: Dannyadmin1');
      console.log('   Password: password');
      console.log('   Role: customer');
    } else {
      console.log('❌ No se pudo actualizar la contraseña');
    }
    
    // Verificar el cambio
    const [users] = await connection.execute(
      'SELECT id, username, role, customer_id FROM users WHERE username = ?', 
      ['Dannyadmin1']
    );
    
    if (users.length > 0) {
      console.log('\n📋 Usuario actualizado:');
      console.log(`   ID: ${users[0].id}`);
      console.log(`   Username: ${users[0].username}`);
      console.log(`   Role: ${users[0].role}`);
      console.log(`   Customer ID: ${users[0].customer_id}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateClientPassword();