const mysql = require('mysql2');

// Configuración de la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  connectionLimit: 10
});

// Función para verificar las tablas existentes
async function checkDatabaseStructure() {
  try {
    const connection = pool.promise();
    
    // Obtener lista de tablas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tablas existentes:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });
    
    // Verificar estructura de la tabla orders
    console.log('\n🔍 Estructura de la tabla orders:');
    const [orderColumns] = await connection.execute('DESCRIBE orders');
    orderColumns.forEach(column => {
      console.log(`  ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key}`);
    });
    
    // Obtener algunos registros de ejemplo
    console.log('\n📊 Primeros 5 pedidos:');
    const [orders] = await connection.execute('SELECT * FROM orders LIMIT 5');
    orders.forEach((order, index) => {
      console.log(`  ${index + 1}. ID: ${order.id}, Guide: ${order.guide}, Provider: ${order.provider_code}`);
    });
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    pool.end();
  }
}

checkDatabaseStructure();