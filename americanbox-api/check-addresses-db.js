const mysql = require('mysql2');

// Configuración de la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  connectionLimit: 10
});

async function checkAddresses() {
  console.log('🔍 Verificando direcciones en la base de datos...\n');

  try {
    const connection = pool.promise();
    
    // Ver direcciones del usuario 1
    const [addresses] = await connection.execute('SELECT * FROM addresses WHERE user_id = 1');
    
    console.log('Direcciones del usuario 1:');
    if (addresses.length === 0) {
      console.log('  ⚠️ El usuario 1 no tiene direcciones');
    } else {
      addresses.forEach(addr => {
        console.log(`  ID: ${addr.id} | Address: ${addr.address} | City: ${addr.city}`);
      });
    }

    // Ver todas las direcciones disponibles
    const [allAddresses] = await connection.execute('SELECT id, user_id, address, city FROM addresses ORDER BY user_id');
    
    console.log('\nTodas las direcciones:');
    allAddresses.forEach(addr => {
      console.log(`  ID: ${addr.id} | User ID: ${addr.user_id} | Address: ${addr.address} | City: ${addr.city}`);
    });

    console.log(`\nTotal direcciones: ${allAddresses.length}`);

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

checkAddresses();