const mysql = require('mysql2');

// Configuración de la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  connectionLimit: 10
});

async function addTrackingFields() {
  try {
    const connection = pool.promise();
    
    console.log('🔄 Agregando campos de tracking a la tabla orders...');
    
    // Agregar campos provider_id y tracking_code
    await connection.execute(`
      ALTER TABLE orders 
      ADD COLUMN provider_id INT(11) NULL,
      ADD COLUMN tracking_code VARCHAR(50) NULL
    `);
    
    console.log('✅ Campos agregados exitosamente');
    
    // Agregar índices
    console.log('🔄 Agregando índices...');
    await connection.execute('ALTER TABLE orders ADD INDEX idx_provider_id (provider_id)');
    await connection.execute('ALTER TABLE orders ADD INDEX idx_tracking_code (tracking_code)');
    
    console.log('✅ Índices agregados exitosamente');
    
    // Agregar foreign key constraint
    console.log('🔄 Agregando foreign key constraint...');
    await connection.execute(`
      ALTER TABLE orders 
      ADD CONSTRAINT fk_orders_provider 
      FOREIGN KEY (provider_id) REFERENCES providers(id) 
      ON DELETE SET NULL
    `);
    
    console.log('✅ Foreign key constraint agregado exitosamente');
    
    // Verificar la nueva estructura
    console.log('\n🔍 Nueva estructura de la tabla orders:');
    const [columns] = await connection.execute('DESCRIBE orders');
    columns.forEach(column => {
      console.log(`  ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key}`);
    });
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    pool.end();
  }
}

addTrackingFields();