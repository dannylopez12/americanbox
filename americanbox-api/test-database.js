const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabase() {
  let connection;
  
  try {
    // Conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME,
      charset: 'utf8mb4_unicode_ci',
    });

    console.log('✅ Conexión a base de datos exitosa');
    
    // Verificar tablas existentes
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📊 Tablas existentes:');
    tables.forEach(table => {
      const tableName = table[`Tables_in_${process.env.DB_NAME}`];
      console.log(`  - ${tableName}`);
    });
    
    // Verificar estructura de usuarios
    console.log('\n👥 Verificando usuarios:');
    try {
      const [users] = await connection.execute('SELECT email, role FROM users LIMIT 5');
      console.log(`  - Total usuarios encontrados: ${users.length}`);
      users.forEach(user => console.log(`    ${user.email} (${user.role})`));
    } catch (err) {
      console.log('  ❌ Tabla users no existe o error:', err.message);
    }
    
    // Verificar datos en cada tabla principal
    const tablesToCheck = ['customers', 'products', 'categories', 'vouchers', 'invoices', 'accounts_receivable'];
    
    for (const table of tablesToCheck) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`📋 ${table}: ${rows[0].count} registros`);
        
        if (rows[0].count === 0) {
          console.log(`  ⚠️  Tabla ${table} está vacía - necesita datos de prueba`);
        }
      } catch (err) {
        console.log(`❌ Tabla ${table} no existe: ${err.message}`);
      }
    }
    
    console.log('\n🔍 Test completado');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testDatabase();