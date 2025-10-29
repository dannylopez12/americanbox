const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAddressesTable() {
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

    console.log('🔍 Verificando tabla addresses...\n');
    
    // Verificar estructura
    const [structure] = await connection.execute('DESCRIBE addresses');
    console.log('📋 Estructura de addresses:');
    structure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(not null)' : '(nullable)'} ${col.Key ? '[' + col.Key + ']' : ''}`);
    });
    
    // Verificar datos
    const [rows] = await connection.execute('SELECT * FROM addresses LIMIT 5');
    console.log('\n📦 Datos de ejemplo en addresses:');
    rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ID: ${row.id}, Address: ${row.address || 'N/A'}, City: ${row.city || 'N/A'}, State: ${row.state || 'N/A'}, Customer: ${row.customer_id || 'N/A'}`);
    });
    
    // Probar query problemática
    console.log('\n🔍 Probando query de tracking...');
    try {
      const [testResult] = await connection.execute(`
        SELECT 
          o.id,
          o.guide,
          o.status,
          o.total,
          DATE(o.created_at) AS created_date,
          CONCAT(COALESCE(a.address, ''), ' / ', COALESCE(a.city, ''), ' / ', COALESCE(a.state, '')) AS full_address,
          COALESCE(c.names, u.username) AS customer_name,
          COALESCE(c.phone, '') AS phone,
          COALESCE(c.email, '') AS email
        FROM orders o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN customers c ON c.id = u.customer_id  
        LEFT JOIN addresses a ON a.id = o.address_id
        WHERE o.guide = 'ECABC20250002'
        LIMIT 1
      `);
      
      if (testResult.length > 0) {
        console.log('  ✅ Query funcionó correctamente');
        console.log(`  📋 Resultado: ${testResult[0].guide} - ${testResult[0].customer_name}`);
      } else {
        console.log('  ❌ No se encontraron resultados');
      }
    } catch (queryError) {
      console.log('  ❌ Error en query:', queryError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAddressesTable();