const mysql = require('mysql2');

// Configuración de la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  connectionLimit: 10
});

// Función para verificar las tablas relacionadas
async function checkRelatedTables() {
  try {
    const connection = pool.promise();
    
    // Verificar estructura de customers
    console.log('🔍 Estructura de la tabla customers:');
    const [customerColumns] = await connection.execute('DESCRIBE customers');
    customerColumns.forEach(column => {
      console.log(`  ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key}`);
    });
    
    // Verificar estructura de users
    console.log('\n🔍 Estructura de la tabla users:');
    const [userColumns] = await connection.execute('DESCRIBE users');
    userColumns.forEach(column => {
      console.log(`  ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key}`);
    });
    
    // Verificar estructura de addresses
    console.log('\n🔍 Estructura de la tabla addresses:');
    const [addressColumns] = await connection.execute('DESCRIBE addresses');
    addressColumns.forEach(column => {
      console.log(`  ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key}`);
    });
    
    // Verificar algunos datos
    console.log('\n📊 Primeros 3 customers:');
    const [customers] = await connection.execute('SELECT * FROM customers LIMIT 3');
    console.log(customers);
    
    console.log('\n📊 Primeros 3 users:');
    const [users] = await connection.execute('SELECT * FROM users LIMIT 3');
    console.log(users);
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    pool.end();
  }
}

checkRelatedTables();