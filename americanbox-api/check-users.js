const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
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

    console.log('🔍 Verificando estructura de tabla users:');
    
    // Verificar estructura
    const [columns] = await connection.execute('DESCRIBE users');
    console.log('Columnas encontradas:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // Verificar datos
    const [users] = await connection.execute('SELECT * FROM users LIMIT 5');
    console.log(`\n👥 Usuarios encontrados: ${users.length}`);
    users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(user)}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUsers();