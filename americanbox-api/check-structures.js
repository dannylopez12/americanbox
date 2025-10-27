const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTableStructures() {
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

    console.log('🔍 Verificando estructuras de tablas importantes:\n');
    
    const tables = ['accounts_receivable', 'invoices', 'products', 'categories'];
    
    for (const table of tables) {
      try {
        console.log(`📋 Estructura de ${table}:`);
        const [columns] = await connection.execute(`DESCRIBE ${table}`);
        columns.forEach(col => {
          console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'} ${col.Key ? `[${col.Key}]` : ''}`);
        });
        console.log('');
      } catch (err) {
        console.log(`❌ Error en tabla ${table}: ${err.message}\n`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTableStructures();