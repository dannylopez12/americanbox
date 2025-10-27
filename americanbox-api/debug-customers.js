const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkCustomersTable() {
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

    console.log('🔍 Verificando tabla customers...\n');
    
    // Verificar estructura
    const [structure] = await connection.execute('DESCRIBE customers');
    console.log('📋 Estructura de customers:');
    structure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(not null)' : '(nullable)'} ${col.Key ? '[' + col.Key + ']' : ''}`);
    });
    
    // Verificar datos
    const [rows] = await connection.execute('SELECT * FROM customers LIMIT 5');
    console.log('\n📦 Datos de ejemplo en customers:');
    rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ID: ${row.id}, Names: ${row.names || 'N/A'}, Email: ${row.email || 'N/A'}, Phone: ${row.phone || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkCustomersTable();