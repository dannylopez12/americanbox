const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox'
};

async function checkCompanySettings() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🔍 Verificando tabla company_settings...\n');
    
    // Describir la estructura de la tabla
    const [structure] = await connection.execute('DESCRIBE company_settings');
    console.log('Estructura de company_settings:');
    structure.forEach(field => {
      console.log(`  - ${field.Field}: ${field.Type} (${field.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Obtener todos los registros
    const [records] = await connection.execute('SELECT * FROM company_settings');
    console.log('\nRegistros en company_settings:');
    console.log(records);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkCompanySettings();