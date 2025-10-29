const mysql = require('mysql2');

// Configuración de la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  connectionLimit: 10
});

async function seedProviders() {
  try {
    const connection = pool.promise();
    
    console.log('🌱 Agregando proveedores de ejemplo...');
    
    const providers = [
      { tracking_code: 'AMAZON', name: 'Amazon', address: 'Amazon Fulfillment Centers, USA' },
      { tracking_code: 'EBAY', name: 'eBay', address: 'eBay Stores, USA' },
      { tracking_code: 'SHEIN', name: 'Shein', address: 'Shein Distribution Centers, USA' },
      { tracking_code: 'TEMU', name: 'Temu', address: 'Temu Warehouses, USA' },
      { tracking_code: 'ALIEXPRESS', name: 'AliExpress', address: 'AliExpress USA Warehouse' },
      { tracking_code: 'MIAMI01', name: 'Miami Warehouse 1', address: 'Miami, FL, USA' },
      { tracking_code: 'DORAL01', name: 'Doral Warehouse 1', address: 'Doral, FL, USA' }
    ];
    
    for (const provider of providers) {
      await connection.execute(
        'INSERT INTO providers (tracking_code, name, address, created_at) VALUES (?, ?, ?, NOW())',
        [provider.tracking_code, provider.name, provider.address]
      );
      console.log(`✅ Proveedor agregado: ${provider.tracking_code} - ${provider.name}`);
    }
    
    // Mostrar proveedores creados
    console.log('\n📊 Proveedores en la base de datos:');
    const [allProviders] = await connection.execute('SELECT * FROM providers');
    allProviders.forEach((provider, index) => {
      console.log(`  ${index + 1}. ID: ${provider.id}, Code: ${provider.tracking_code}, Name: ${provider.name}`);
    });
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    pool.end();
  }
}

seedProviders();