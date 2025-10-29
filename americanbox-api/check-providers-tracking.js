const mysql = require('mysql2');

// Configuración de la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  connectionLimit: 10
});

async function checkProvidersAndOrders() {
  try {
    const connection = pool.promise();
    
    // Verificar estructura de la tabla providers
    console.log('🔍 Estructura de la tabla providers:');
    const [providerColumns] = await connection.execute('DESCRIBE providers');
    providerColumns.forEach(column => {
      console.log(`  ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key}`);
    });
    
    // Obtener algunos proveedores de ejemplo
    console.log('\n📊 Proveedores existentes:');
    const [providers] = await connection.execute('SELECT * FROM providers');
    providers.forEach((provider, index) => {
      console.log(`  ${index + 1}. ID: ${provider.id}, Tracking: ${provider.tracking_code}, Name: ${provider.name}`);
    });
    
    // Verificar qué campos de tracking existen en orders
    console.log('\n🔍 Verificando si orders tiene campos de tracking:');
    const [orderColumns] = await connection.execute('DESCRIBE orders');
    const trackingFields = orderColumns.filter(col => 
      col.Field.includes('tracking') || 
      col.Field.includes('provider')
    );
    
    if (trackingFields.length > 0) {
      console.log('✅ Campos de tracking/provider encontrados:');
      trackingFields.forEach(field => {
        console.log(`  ${field.Field}: ${field.Type}`);
      });
    } else {
      console.log('❌ No se encontraron campos de tracking/provider en orders');
    }
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    pool.end();
  }
}

checkProvidersAndOrders();