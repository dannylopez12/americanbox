const mysql = require('mysql2/promise');
require('dotenv').config();

async function analyzeUserPricing() {
  console.log('🔍 Analizando sistema de precios actual...\n');

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
    connectionLimit: 10,
    charset: 'utf8mb4_unicode_ci',
  });

  try {
    // Verificar estructura de tabla users
    console.log('📋 Estructura de tabla users:');
    const [userStructure] = await pool.query('DESCRIBE users');
    userStructure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key || ''}`);
    });

    // Verificar si existe campo de precio personalizado
    console.log('\n🔍 Verificando campos de precio...');
    const hasPriceField = userStructure.some(col => 
      col.Field.includes('price') || col.Field.includes('rate') || col.Field.includes('cost')
    );
    console.log('Campo de precio personalizado:', hasPriceField ? '✅ Encontrado' : '❌ No encontrado');

    // Verificar tabla company_settings para precios por defecto
    console.log('\n📋 Estructura de tabla company_settings:');
    const [settingsStructure] = await pool.query('DESCRIBE company_settings');
    settingsStructure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key || ''}`);
    });

    // Verificar configuraciones existentes
    console.log('\n⚙️ Configuraciones existentes:');
    const [settings] = await pool.query('SELECT * FROM company_settings LIMIT 10');
    if (settings.length > 0) {
      settings.forEach(setting => {
        console.log(`  ${setting.key}: ${setting.value}`);
      });
    } else {
      console.log('  No hay configuraciones guardadas');
    }

    // Verificar algunos pedidos para ver cómo se calcula el total actual
    console.log('\n💰 Análisis de totales en pedidos:');
    const [orders] = await pool.query(`
      SELECT o.id, o.guide, o.total, u.name as client_name, 
             (SELECT weight_lbs FROM packages WHERE order_id = o.id LIMIT 1) as weight
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      WHERE o.total > 0 
      LIMIT 5
    `);
    
    if (orders.length > 0) {
      orders.forEach(order => {
        const pricePerLb = order.weight ? (order.total / order.weight).toFixed(2) : 'N/A';
        console.log(`  ${order.guide}: $${order.total} | Peso: ${order.weight || 'N/A'} lbs | $/lb: ${pricePerLb}`);
      });
    } else {
      console.log('  No hay pedidos con total > 0');
    }

    // Verificar tabla packages
    console.log('\n📦 Estructura de tabla packages:');
    const [packagesStructure] = await pool.query('DESCRIBE packages');
    packagesStructure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key || ''}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeUserPricing();