const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'americanbox',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkAddressesTable() {
  console.log('🔍 Checking addresses table structure...');
  
  try {
    const conn = await pool.getConnection();
    
    try {
      console.log('\n1. Describiendo la tabla addresses...');
      const [structure] = await conn.query('DESCRIBE addresses');
      console.log('Estructura de la tabla addresses:');
      structure.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
      
      console.log('\n2. Ejemplo de datos en addresses...');
      const [sample] = await conn.query('SELECT * FROM addresses LIMIT 3');
      console.log('Datos de ejemplo:', sample);
      
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAddressesTable();