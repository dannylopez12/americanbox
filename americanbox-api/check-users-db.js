const mysql = require('mysql2');

// Configuración de la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  connectionLimit: 10
});

async function checkUsers() {
  console.log('🔍 Verificando usuarios en la base de datos...\n');

  try {
    const connection = pool.promise();
    
    // Ver todos los usuarios
    const [users] = await connection.execute('SELECT id, username, role FROM users ORDER BY id');
    
    console.log('Usuarios encontrados:');
    users.forEach(user => {
      console.log(`  ID: ${user.id} | Username: ${user.username} | Role: ${user.role}`);
    });

    if (users.length === 0) {
      console.log('  ⚠️ No hay usuarios en la base de datos');
    }

    console.log(`\nTotal usuarios: ${users.length}`);

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

checkUsers();