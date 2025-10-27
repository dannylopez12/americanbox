const mysql = require('mysql2/promise');

async function analyzeMiamiDoralImplementation() {
  console.log('🔍 ANÁLISIS: Sistema de Ubicaciones Miami/Doral');
  console.log('===============================================');
  
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'americanbox'
  });

  try {
    const conn = await pool.getConnection();
    
    // 1. Verificar estructura actual de tablas relevantes
    console.log('\n1. 🏗️  Estructura actual de orders:');
    const [ordersColumns] = await conn.query('DESCRIBE orders');
    ordersColumns.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null} ${col.Key}`);
    });
    
    console.log('\n2. 🏗️  Estructura actual de company_settings:');
    const [settingsColumns] = await conn.query('DESCRIBE company_settings');
    settingsColumns.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null} ${col.Key}`);
    });
    
    // 3. Verificar configuraciones actuales
    console.log('\n3. ⚙️  Configuraciones actuales:');
    const [settings] = await conn.query('SELECT * FROM company_settings LIMIT 1');
    if (settings.length > 0) {
      console.log('   Configuraciones encontradas:');
      Object.keys(settings[0]).forEach(key => {
        console.log(`      ${key}: ${settings[0][key]}`);
      });
    } else {
      console.log('   ❌ No hay configuraciones en company_settings');
    }
    
    // 4. Verificar si hay algún campo relacionado con ubicación
    console.log('\n4. 📍 Búsqueda de campos de ubicación existentes:');
    
    // Buscar en orders
    const locationFields = ordersColumns.filter(col => 
      col.Field.toLowerCase().includes('location') || 
      col.Field.toLowerCase().includes('warehouse') ||
      col.Field.toLowerCase().includes('origin') ||
      col.Field.toLowerCase().includes('destination')
    );
    
    if (locationFields.length > 0) {
      console.log('   ✅ Campos de ubicación encontrados en orders:');
      locationFields.forEach(field => {
        console.log(`      ${field.Field}: ${field.Type}`);
      });
    } else {
      console.log('   ⚠️  No hay campos de ubicación en orders');
    }
    
    // 5. Verificar órdenes recientes para entender el flujo
    console.log('\n5. 📦 Análisis de órdenes recientes:');
    const [recentOrders] = await conn.query(`
      SELECT id, guide, status, created_at
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('   Órdenes recientes:');
    recentOrders.forEach(order => {
      console.log(`      ${order.id}: ${order.guide} - ${order.status} (${order.created_at})`);
    });
    
    conn.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
  
  console.log('\n📋 PLAN DE IMPLEMENTACIÓN:');
  console.log('1. 🏗️  Agregar campo "location" a tabla orders');
  console.log('2. ⚙️  Agregar configuración por defecto en company_settings'); 
  console.log('3. 🖥️  Actualizar backend para manejar ubicaciones');
  console.log('4. 🎨 Actualizar frontend admin para seleccionar ubicación');
  console.log('5. 🧪 Probar flujo completo con ambas ubicaciones');
}

analyzeMiamiDoralImplementation();